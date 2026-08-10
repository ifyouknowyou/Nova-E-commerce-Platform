import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SellerService } from './seller.service';

describe('SellerService.order state machine', () => {
  let service: SellerService;
  let payments: { refundOrder: jest.Mock };
  const prisma = {
    db: {
      store: { findFirst: jest.fn().mockResolvedValue({ id: 'store-1', status: 'ACTIVE' }) },
      orderItem: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      product: { update: jest.fn() },
    },
  };
  const uploads = { deleteImage: jest.fn() };

  const makeItem = (status: string, paymentStatus = 'PAID') => ({
    id: 'item-1',
    orderId: 'order-1',
    storeId: 'store-1',
    productId: 'p-1',
    quantity: 2,
    status,
    order: { paymentStatus },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    payments = { refundOrder: jest.fn().mockResolvedValue(true) };
    service = new SellerService(prisma as any, payments as any, uploads as any);
  });

  it('rejects an illegal jump (PENDING -> DELIVERED)', async () => {
    prisma.db.orderItem.findFirst.mockResolvedValue(makeItem('PENDING', 'PAID'));

    await expect(service.updateOrderItemStatus('seller-1', 'item-1', 'DELIVERED')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects delivering an UNPAID order', async () => {
    // SHIPPED -> DELIVERED is a legal auto step, but only for paid orders.
    prisma.db.orderItem.findFirst.mockResolvedValue(makeItem('SHIPPED', 'PENDING'));

    await expect(service.updateOrderItemStatus('seller-1', 'item-1', 'DELIVERED')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows SHIPPED -> DELIVERED for a paid order', async () => {
    prisma.db.orderItem.findFirst.mockResolvedValue(makeItem('SHIPPED', 'PAID'));
    prisma.db.orderItem.update.mockResolvedValue(null);

    await service.updateOrderItemStatus('seller-1', 'item-1', 'DELIVERED');

    expect(prisma.db.orderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DELIVERED' }) }),
    );
    expect(payments.refundOrder).not.toHaveBeenCalled();
  });

  it('restores stock and refunds a PAID order when a seller cancels it', async () => {
    prisma.db.orderItem.findFirst.mockResolvedValue(makeItem('CONFIRMED', 'PAID'));
    prisma.db.orderItem.update.mockResolvedValue(null);

    await service.updateOrderItemStatus('seller-1', 'item-1', 'CANCELLED');

    expect(prisma.db.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stock: { increment: 2 } }) }),
    );
    expect(payments.refundOrder).toHaveBeenCalledWith('order-1');
  });

  it('blocks a seller from acting on another store\'s order', async () => {
    prisma.db.orderItem.findFirst.mockResolvedValue(null);

    await expect(service.updateOrderItemStatus('seller-1', 'item-other', 'SHIPPED')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('SellerService.product releaseDate', () => {
  let service: SellerService;
  let payments: { refundOrder: jest.Mock };
  const prisma = {
    db: {
      store: { findFirst: jest.fn().mockResolvedValue({ id: 'store-1', status: 'ACTIVE' }) },
      product: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    },
  };
  const uploads = { deleteImage: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    payments = { refundOrder: jest.fn().mockResolvedValue(true) };
    service = new SellerService(prisma as any, payments as any, uploads as any);
  });

  it('persists releaseDate as a Date when creating a product', async () => {
    prisma.db.product.create.mockResolvedValue({ id: 'p-1' });

    await service.createProduct('seller-1', {
      name: 'Nova Hoodie',
      sku: 'SKU-1',
      price: 20,
      stock: 5,
      categoryId: 'cat-1',
      releaseDate: '2026-09-01T00:00:00.000Z',
    } as any);

    expect(prisma.db.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          releaseDate: new Date('2026-09-01T00:00:00.000Z'),
          status: 'PENDING',
        }),
      }),
    );
  });

  it('writes releaseDate on update and does NOT demote an approved product to PENDING', async () => {
    prisma.db.product.findFirst.mockResolvedValue({ id: 'p-1', status: 'APPROVED', price: 100, salePrice: null });
    prisma.db.product.update.mockResolvedValue({ id: 'p-1' });

    await service.updateProduct('seller-1', 'p-1', { releaseDate: '2026-12-01T00:00:00.000Z' } as any);

    const [[call]] = prisma.db.product.update.mock.calls as unknown as [
      [{ where: { id: string }; data: Record<string, unknown> }],
    ];
    expect(call.where).toEqual({ id: 'p-1' });
    expect(call.data.releaseDate).toEqual(new Date('2026-12-01T00:00:00.000Z'));
    expect(call.data.status).toBeUndefined();
  });

  it('clears releaseDate with an empty string without demoting', async () => {
    prisma.db.product.findFirst.mockResolvedValue({ id: 'p-1', status: 'APPROVED', price: 100, salePrice: null });
    prisma.db.product.update.mockResolvedValue({ id: 'p-1' });

    await service.updateProduct('seller-1', 'p-1', { releaseDate: '' } as any);

    const args = prisma.db.product.update.mock.calls[0] as unknown as [{ data: Record<string, unknown> }];
    expect(args[0].data.releaseDate).toBeNull();
    expect(args[0].data.status).toBeUndefined();
  });

  it('rejects an invalid releaseDate', async () => {
    prisma.db.product.findFirst.mockResolvedValue({ id: 'p-1', status: 'APPROVED', price: 100, salePrice: null });

    await expect(
      service.updateProduct('seller-1', 'p-1', { releaseDate: 'not-a-date' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});