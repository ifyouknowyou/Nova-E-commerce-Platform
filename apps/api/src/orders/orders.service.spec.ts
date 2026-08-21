import { CouponsService } from '../coupons/coupons.service';
import { OrdersService } from './orders.service';

describe('OrdersService.cancel', () => {
  let service: OrdersService;
  let payments: { refundOrder: jest.Mock };

  const order = {
    id: 'order-1',
    userId: 'u1',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    couponId: 'coupon-1',
    subtotal: 100,
    discount: 10,
    shippingCost: 0,
    tax: 0,
    total: 90,
    currency: 'USD',
    notes: null,
    trackingNumber: null,
    placedAt: new Date(),
    shippingMethod: null,
    invoiceNumber: 'INV-1',
    shippingAddress: { postalCode: '10001' },
    items: [],
    timeline: [],
  };

  const db: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    orderItem: { findMany: jest.Mock };
    product: { update: jest.Mock };
    coupon: { update: jest.Mock };
    couponUsage: { deleteMany: jest.Mock };
    orderTimeline: { create: jest.Mock };
    $transaction: jest.Mock;
  } = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    orderItem: { findMany: jest.fn().mockResolvedValue([{ productId: 'p-1', quantity: 2 }]) },
    product: { update: jest.fn() },
    coupon: { update: jest.fn() },
    couponUsage: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    orderTimeline: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  db.$transaction = jest.fn(async (cb: (tx: typeof db) => unknown) => cb(db));
  const prisma = { db };
  const coupons = {} as CouponsService;

  beforeEach(() => {
    jest.clearAllMocks();
    payments = { refundOrder: jest.fn().mockResolvedValue(true) };
    service = new OrdersService(prisma as any, coupons, payments as any);
  });

  it('refunds a PAID order before cancelling it and restores stock + coupon usage', async () => {
    prisma.db.order.findUnique.mockResolvedValue(order);

    await service.cancel('u1', 'order-1');

    // Paid orders are refunded FIRST.
    expect(payments.refundOrder).toHaveBeenCalledWith('order-1');
    // Stock is returned and coupon usage rolled back.
    expect(prisma.db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stock: { increment: 2 } }) }),
    );
    expect(prisma.db.couponUsage.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'order-1' } });
    expect(prisma.db.coupon.update).toHaveBeenCalledWith({
      where: { id: 'coupon-1' },
      data: { usedCount: { decrement: 1 } },
    });
  });

  it('does NOT refund an unpaid PENDING order', async () => {
    prisma.db.order.findUnique.mockResolvedValue({ ...order, status: 'PENDING', paymentStatus: 'PENDING' });

    await service.cancel('u1', 'order-1');

    expect(payments.refundOrder).not.toHaveBeenCalled();
  });

  it('refuses to cancel when the refund fails (fail-closed)', async () => {
    payments.refundOrder.mockRejectedValue(new Error('gateway down'));
    prisma.db.order.findUnique.mockResolvedValue(order);

    await expect(service.cancel('u1', 'order-1')).rejects.toThrow('gateway down');
    // Order must not be marked CANCELLED.
    expect(prisma.db.order.update).not.toHaveBeenCalled();
  });
});