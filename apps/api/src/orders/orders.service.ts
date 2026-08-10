import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Order, OrderItem } from '@prisma/client';
import { CANCELLABLE_ORDER_STATUSES } from '@nova/shared';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';

export interface OrderDetailResponse {
  id: string;
  invoiceNumber: string | null;
  status: Order['status'];
  paymentStatus: Order['paymentStatus'];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  trackingNumber: string | null;
  placedAt: string;
  shippingMethod: string | null;
  shippingPostalCode: string | null;
  items: {
    id: string;
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
    status: OrderItem['status'];
  }[];
  timeline: { id: string; status: string; note: string | null; createdAt: string }[];
}

const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING = 4.99;
const EXPRESS_SHIPPING = 9.99;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponsService,
    private readonly payments: PaymentsService,
  ) {}

  async checkout(userId: string, dto: CheckoutOrderDto): Promise<OrderDetailResponse> {
    const cart = await this.prisma.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: { include: { store: { select: { id: true, commissionRate: true } } } },
            variant: true,
          },
        },
      },
    });

    const cartItems = cart?.items ?? [];
    if (cartItems.length === 0) throw new BadRequestException('Your cart is empty');

    // Validate stock before locking order creation. A variant purchase draws
    // from the variant's own stock pool, not the product-level stock.
    for (const item of cartItems) {
      const stock = item.variant ? item.variant.stock : item.product.stock;
      if (stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
      }
    }

    // Price is re-quoted from the CURRENT product price, not the stale cart
    // snapshot — customers are charged what the product costs at checkout.
    const subtotal = cartItems.reduce(
      (sum, item) => sum + this.unitPrice(item) * item.quantity,
      0,
    );

    // Coupon
    let discount = 0;
    let couponId: string | undefined;
    if (dto.couponCode?.trim()) {
      const cartStoreIds = Array.from(new Set(cartItems.map((i) => i.product.storeId)));
      const applied = await this.coupons.apply(dto.couponCode.trim(), userId, subtotal, cartStoreIds);
      discount = applied.discount;
      couponId = applied.couponId;
    }

    const shippingCost = this.shippingCost(dto.shippingMethod, subtotal);
    const tax = await this.taxAmount(subtotal);
    const total = Math.round((subtotal - discount + shippingCost + tax) * 100) / 100;

    const shippingAddress = await this.toAddress(userId, dto.shipping);
    const billingAddress = dto.billing
      ? await this.toAddress(userId, dto.billing)
      : shippingAddress;

    // Create order + items + timeline atomically, decrement stock, clear cart.
    const order = await this.prisma.db.$transaction(async (tx) => {
      // Decrement stock safely (atomic guard against oversell). Variant items
      // draw from the variant's stock and only bump the product-level soldCount.
      for (const item of cartItems) {
        if (item.variantId) {
          const variantResult = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantResult.count === 0) {
            throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { increment: item.quantity } },
          });
        } else {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
          });
          if (result.count === 0) {
            throw new BadRequestException(`Insufficient stock for "${item.product.name}"`);
          }
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          email: (await tx.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? '',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal,
          discount,
          shippingCost,
          tax,
          total,
          currency: 'USD',
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          shippingMethod: dto.shippingMethod,
          notes: dto.notes,
          invoiceNumber: this.generateInvoiceNumber(),
          couponId,
          items: {
            create: cartItems.map((item) => ({
              storeId: item.product.storeId,
              productId: item.productId,
              variantId: item.variantId,
              nameSnapshot: item.product.name,
              skuSnapshot: item.product.sku,
              unitPrice: this.unitPrice(item),
              quantity: item.quantity,
              total: this.unitPrice(item) * item.quantity,
              commissionRate: item.product.store.commissionRate ?? 0.1,
            })),
          },
          timeline: {
            create: [{ status: 'PENDING', note: 'Order placed' }],
          },
        },
      });

      if (couponId) {
        // Lock the coupon row so concurrent checkouts serialize here, then
        // re-check the global and per-user limits against fresh counts before
        // recording usage (closes the check-then-act race on coupon.usedCount
        // and couponUsage rows).
        const locked = await tx.$queryRaw<
          { id: string; usedCount: number; usageLimit: number | null; perUserLimit: number }[]
        >`SELECT id, "usedCount", "usageLimit", "perUserLimit" FROM "Coupon" WHERE id = ${couponId} FOR UPDATE`;
        const couponLocked = locked[0];
        if (!couponLocked) throw new BadRequestException('Coupon is no longer available');

        if (couponLocked.usageLimit !== null && Number(couponLocked.usedCount) >= Number(couponLocked.usageLimit)) {
          throw new BadRequestException('Coupon usage limit reached');
        }
        const usedByUser = await tx.couponUsage.count({ where: { couponId, userId } });
        if (usedByUser >= couponLocked.perUserLimit) throw new BadRequestException('Coupon already used');

        await tx.couponUsage.create({
          data: { couponId, userId, orderId: created.id, discountAmount: discount },
        });
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });

      return created;
    });

    await this.prisma.db.notification.create({
      data: {
        userId,
        type: 'ORDER',
        title: 'Order placed',
        message: `Your order ${order.invoiceNumber ?? order.id} has been placed.`,
        data: { orderId: order.id } as never,
      },
    });

    return this.getOrderDetail(userId, order.id, true);
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return this.prisma.db.order.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      include: {
        items: { select: { id: true, nameSnapshot: true, unitPrice: true, quantity: true, total: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async getOrderDetail(
    userId: string,
    orderId: string,
    isInternal = false,
  ): Promise<OrderDetailResponse> {
    const order = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        timeline: { orderBy: { createdAt: 'asc' } },
        shippingAddress: { select: { postalCode: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!isInternal && order.userId !== userId) throw new ForbiddenException('Not your order');

    return {
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      tax: Number(order.tax),
      total: Number(order.total),
      currency: order.currency,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      placedAt: order.placedAt.toISOString(),
      shippingMethod: order.shippingMethod,
      shippingPostalCode: order.shippingAddress?.postalCode ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.nameSnapshot,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        total: Number(item.total),
        status: item.status,
      })),
      timeline: order.timeline.map((entry) => ({
        id: entry.id,
        status: entry.status,
        note: entry.note,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  async cancel(userId: string, orderId: string): Promise<OrderDetailResponse> {
    const order = await this.prisma.db.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { id: true, status: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    if (!CANCELLABLE_ORDER_STATUSES.has(order.status)) {
      throw new BadRequestException('This order can no longer be cancelled');
    }

    // Goods that have already shipped/delivered are not refundable by cancel —
    // the customer must use the returns flow instead. Checked BEFORE any refund
    // so a rejected cancel never leaves a half-refunded order behind.
    if (order.items.some((item) => item.status === 'SHIPPED' || item.status === 'DELIVERED')) {
      throw new BadRequestException('This order contains shipped or delivered items and can no longer be cancelled; request a return instead');
    }

    // A paid order is refunded FIRST (fail-closed): if the refund fails, the
    // order is not cancelled and stock is not returned — the customer keeps
    // their goods rather than losing both money and product.
    if (order.paymentStatus === 'PAID') {
      await this.payments.refundOrder(orderId);
    }

    await this.prisma.db.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
        }
      }
      // Roll back coupon usage so a cancelled order does not consume the coupon.
      if (order.couponId) {
        const usage = await tx.couponUsage.deleteMany({ where: { orderId } });
        if (usage.count > 0) {
          await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
        }
      }
      await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
      await tx.orderTimeline.create({ data: { orderId, status: 'CANCELLED', note: 'Cancelled by customer' } });
    });

    return this.getOrderDetail(userId, orderId, true);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private shippingCost(method: string, subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return method === 'express' ? EXPRESS_SHIPPING : STANDARD_SHIPPING;
  }

  /** Tax from the configured platform rate (Setting `taxes.rate`), applied to the taxable subtotal. */
  private async taxAmount(subtotal: number): Promise<number> {
    let rate = 0;
    try {
      const row = await this.prisma.db.setting.findFirst({
        where: { key: { in: ['taxes.rate', 'tax.rate', 'tax'] } },
      });
      const raw = row?.value;
      rate =
        typeof raw === 'number'
          ? raw
          : raw && typeof raw === 'object'
            ? Number((raw as { rate?: unknown }).rate ?? 0)
            : 0;
    } catch {
      rate = 0;
    }
    if (!Number.isFinite(rate) || rate <= 0) return 0;
    return Math.round(subtotal * rate * 100) / 100;
  }

  /** Effective unit price charged for a cart item: current sale price (or price) plus any variant price delta. */
  private unitPrice(item: { product: { price: unknown; salePrice: unknown }; variant?: { priceDelta: unknown } | null }): number {
    const salePrice = item.product.salePrice;
    const price = item.product.price;
    const base = Number(salePrice !== null && salePrice !== undefined ? salePrice : price);
    return base + Number(item.variant?.priceDelta ?? 0);
  }

  private async toAddress(userId: string, input: CheckoutOrderDto['shipping']) {
    // Reuse an existing matching address instead of inserting a duplicate row on
    // every checkout (address book hygiene).
    const existing = await this.prisma.db.address.findFirst({
      where: {
        userId,
        deletedAt: null,
        line1: input.line1,
        city: input.city,
        postalCode: input.postalCode,
        country: input.country,
      },
    });
    if (existing) return existing;

    return this.prisma.db.address.create({
      data: {
        userId,
        type: 'SHIPPING',
        label: input.label,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone,
        isDefault: input.saveAsDefault ?? false,
      },
    });
  }

  private generateInvoiceNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}