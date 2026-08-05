import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Order, PaymentProvider } from '@prisma/client';
import { CONFIG, type AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentProvider, StripePaymentProvider, type PaymentProvider as IPaymentProvider } from './payment-providers';
import { verifyStripeSignature } from './stripe-webhook';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: IPaymentProvider;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {
    if (config.stripeSecretKey) {
      // Live Stripe requires the SDK to be installed (npm i stripe).
      try {
        this.provider = new StripePaymentProvider(config.stripeSecretKey);
      } catch (err) {
        // NEVER fall back to the Mock provider in production — that would enable
        // free checkout. Fail closed and refuse to boot.
        if (config.env === 'production') {
          throw new Error(
            `Stripe provider failed to initialize in production: ${(err as Error).message}`,
          );
        }
        this.logger.warn('Stripe unavailable — using Mock provider in development only');
        this.provider = new MockPaymentProvider();
      }
    } else {
      if (config.env === 'production') {
        throw new Error('STRIPE_SECRET_KEY is required in production (payment must fail closed)');
      }
      this.logger.warn('No STRIPE_SECRET_KEY — using Mock provider in development only');
      this.provider = new MockPaymentProvider();
    }
  }

  get providerName(): PaymentProvider {
    return this.provider.name;
  }

  async start(userId: string, orderId: string): Promise<PaymentProviderResponse> {
    const order = await this.ownedOrder(userId, orderId);
    if (order.paymentStatus !== 'PENDING' || order.status === 'CANCELLED') {
      throw new BadRequestException('This order is not awaiting payment');
    }

    const { providerRef, clientSecret } = await this.provider.start(order);

    const existing = await this.prisma.db.payment.findFirst({ where: { orderId, provider: this.provider.name } });
    await (existing
      ? this.prisma.db.payment.update({
          where: { id: existing.id },
          data: { providerPaymentId: providerRef, status: 'PENDING', metadata: { clientSecret } },
        })
      : this.prisma.db.payment.create({
          data: { orderId, provider: this.provider.name, providerPaymentId: providerRef, amount: order.total, currency: order.currency, status: 'PENDING', metadata: { clientSecret } },
        }));

    return { orderId, provider: this.provider.name, clientSecret };
  }

  async confirm(userId: string, orderId: string): Promise<{ message: string; paymentStatus: string }> {
    await this.ownedOrder(userId, orderId);
    const payment = await this.prisma.db.payment.findFirst({ where: { orderId } });
    if (!payment || payment.status !== 'PENDING') {
      throw new BadRequestException('No pending payment for this order');
    }

    // Provider re-verifies gateway status === 'succeeded' AND exact amount, so a
    // client cannot confirm a payment that did not settle (or for a wrong amount).
    await this.provider.confirm({ providerRef: payment.providerPaymentId, amount: Number(payment.amount) });
    await this.markPaid(payment.id, orderId);

    return { message: 'Payment received', paymentStatus: 'PAID' };
  }

  /**
   * Server-authoritative payment confirmation via a Stripe webhook. Verifies
   * the signature, resolves the payment by provider reference, and is
   * idempotent (replaying the same event id is a no-op).
   */
  async handleWebhook(rawBody: Buffer, signature?: string): Promise<{ received: true }> {
    if (!this.config.stripeWebhookSecret) {
      throw new BadRequestException('Webhook verification is not configured');
    }
    const event = verifyStripeSignature(rawBody, signature, this.config.stripeWebhookSecret);
    const providerRef = event.data.object.id;

    const payment = await this.prisma.db.payment.findFirst({ where: { providerPaymentId: providerRef } });
    if (!payment) throw new NotFoundException('Payment not found');

    // Idempotent replay guard.
    if (payment.webhookEventId === event.id) return { received: true };

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.markPaid(payment.id, payment.orderId, event.id);
        break;
      case 'payment_intent.payment_failed':
        await this.prisma.db.$transaction([
          this.prisma.db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', webhookEventId: event.id } }),
          this.prisma.db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'FAILED' } }),
        ]);
        break;
      case 'charge.refunded': {
        // A server-initiated refund (cancel/returns) already recorded a REFUND
        // transaction; Stripe then echoes `charge.refunded`. Only record once.
        const existingRefund = await this.prisma.db.transaction.findFirst({
          where: { paymentId: payment.id, type: 'REFUND' },
          select: { id: true },
        });
        if (existingRefund) {
          await this.prisma.db.payment.update({ where: { id: payment.id }, data: { webhookEventId: event.id } });
          break;
        }
        await this.prisma.db.$transaction([
          this.prisma.db.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED', webhookEventId: event.id } }),
          this.prisma.db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'REFUNDED' } }),
          this.prisma.db.transaction.create({
            data: { orderId: payment.orderId, paymentId: payment.id, type: 'REFUND', amount: payment.amount, currency: payment.currency, status: 'REFUNDED', providerRef },
          }),
        ]);
        break;
      }
      default:
        // Non-fatal event — record for idempotency and ignore.
        await this.prisma.db.payment.update({ where: { id: payment.id }, data: { webhookEventId: event.id } });
    }

    return { received: true };
  }

  /** Flag a payment + order as paid and append audit trail atomically. */
  private async markPaid(paymentId: string, orderId: string, webhookEventId?: string): Promise<void> {
    const payment = await this.prisma.db.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, currency: true, providerPaymentId: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // An order cancelled while payment was still in flight must never be
    // resurrected. The charge has settled, so refund it automatically instead.
    const order = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (order?.status === 'CANCELLED') {
      this.logger.warn(`Payment ${paymentId} settled after order ${orderId} was cancelled; auto-refunding`);
      try {
        await this.provider.refund({ providerRef: payment.providerPaymentId, amount: Number(payment.amount) });
      } catch (err) {
        this.logger.error(`Auto-refund failed for cancelled order ${orderId}: ${(err as Error).message}`);
      }
      await this.prisma.db.$transaction([
        this.prisma.db.payment.update({
          where: { id: paymentId },
          data: { status: 'REFUNDED', ...(webhookEventId ? { webhookEventId } : {}) },
        }),
        this.prisma.db.order.update({ where: { id: orderId }, data: { paymentStatus: 'REFUNDED' } }),
        this.prisma.db.transaction.create({
          data: { orderId, paymentId, type: 'REFUND', amount: payment.amount, currency: payment.currency, status: 'REFUNDED', providerRef: payment.providerPaymentId },
        }),
      ]);
      return;
    }

    await this.prisma.db.$transaction([
      this.prisma.db.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', ...(webhookEventId ? { webhookEventId } : {}) },
      }),
      this.prisma.db.order.update({ where: { id: orderId }, data: { paymentStatus: 'PAID', status: 'CONFIRMED' } }),
      this.prisma.db.transaction.create({
        data: { orderId, paymentId, type: 'CAPTURE', amount: payment.amount, currency: payment.currency, status: 'PAID', providerRef: payment.providerPaymentId },
      }),
      this.prisma.db.orderTimeline.create({ data: { orderId, status: 'CONFIRMED', note: 'Payment received' } }),
    ]);
  }

  /**
   * Refund an already-paid payment through the gateway and persist the outcome.
   * Idempotent: a payment already marked REFUNDED is a no-op.
   */
  async refundPayment(paymentId: string): Promise<void> {
    // Hold a FOR UPDATE row lock on the payment for the whole refund so two
    // concurrent refunds (e.g. seller-cancel + returns) cannot both pass the
    // PAID check and double-refund through the gateway.
    await this.prisma.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${paymentId} FOR UPDATE`;
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, providerPaymentId: true, amount: true, currency: true, status: true, orderId: true },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === 'REFUNDED') return;
      if (payment.status !== 'PAID') {
        throw new BadRequestException('Only paid payments can be refunded');
      }

      await this.provider.refund({ providerRef: payment.providerPaymentId, amount: Number(payment.amount) });

      await tx.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'REFUNDED' } });
      await tx.transaction.create({
        data: {
          orderId: payment.orderId,
          paymentId: payment.id,
          type: 'REFUND',
          amount: payment.amount,
          currency: payment.currency,
          status: 'REFUNDED',
          providerRef: payment.providerPaymentId,
        },
      });
    });
  }

  /** Refund the PAID payment for an order, if one exists. Returns true if refunded. */
  async refundOrder(orderId: string): Promise<boolean> {
    const payment = await this.prisma.db.payment.findFirst({
      where: { orderId, status: 'PAID' },
      select: { id: true },
    });
    if (!payment) return false;
    await this.refundPayment(payment.id);
    return true;
  }

  private async ownedOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.prisma.db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    return order;
  }
}

export interface PaymentProviderResponse {
  orderId: string;
  provider: PaymentProvider;
  clientSecret?: string;
}