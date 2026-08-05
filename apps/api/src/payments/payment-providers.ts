import { Injectable, Logger } from '@nestjs/common';
import { type Order, type PaymentProvider as ProviderName } from '@prisma/client';

/**
 * Payment gateway abstraction. NOVA ships with a Mock provider (used only in
 * development) and a Stripe provider behind the same interface. The Mock
 * provider is NEVER selected in production — payments fail closed instead.
 */
export interface PaymentProvider {
  readonly name: ProviderName;
  /** Begin payment for an order; returns a gateway reference. */
  start(order: Order): Promise<{ providerRef: string; clientSecret?: string }>;
  /**
   * Confirm the payment succeeded for the exact order amount. Amount is in
   * currency units; the gateway amount is compared in the smallest unit.
   */
  confirm(payment: { providerRef: string; amount: number }): Promise<void>;
  /** Refund an already-captured payment. Amount in currency units. */
  refund(payment: { providerRef: string; amount: number }): Promise<void>;
}

/** Development provider — approves instantly, no external gateway needed. */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name: ProviderName = 'MOCK';
  private readonly logger = new Logger(MockPaymentProvider.name);

  async start(order: Order): Promise<{ providerRef: string }> {
    const ref = `mock_${order.id}`;
    this.logger.log(`[mock] Payment started for order ${order.id}`);
    return { providerRef: ref };
  }

  async confirm(): Promise<void> {
    // Nothing to verify in mock mode (dev/test only).
  }

  async refund(): Promise<void> {
    // Nothing to reverse in mock mode (dev/test only).
  }
}

/** Stripe provider — active when STRIPE_SECRET_KEY is configured. */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly name: ProviderName = 'STRIPE';
  private stripe: unknown;

  constructor(secretKey: string) {
    // Lazy-load the SDK only when configured (stripe must be installed to use it).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    this.stripe = new Stripe(secretKey);
  }

  async start(order: Order): Promise<{ providerRef: string; clientSecret?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intent = await (this.stripe as any).paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: order.currency.toLowerCase(),
      metadata: { orderId: order.id },
    });
    return { providerRef: intent.id, clientSecret: intent.client_secret };
  }

  async confirm(payment: { providerRef: string; amount: number }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intent = await (this.stripe as any).paymentIntents.retrieve(payment.providerRef);
    // Only a SUCCEEDED intent counts — `processing` means funds have not settled
    // and treating it as paid would let a declined/uncaptured payment ship goods.
    if (intent.status !== 'succeeded') {
      throw new Error(`Payment not successful (status: ${intent.status})`);
    }
    // Re-verify the exact amount server-side against the gateway.
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (Number(intent.amount) !== expectedAmount) {
      throw new Error(
        `Payment amount mismatch: gateway ${intent.amount} !== expected ${expectedAmount}`,
      );
    }
  }

  async refund(payment: { providerRef: string; amount: number }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.stripe as any).refunds.create({
      payment_intent: payment.providerRef,
      amount: Math.round(Number(payment.amount) * 100),
    });
  }
}
