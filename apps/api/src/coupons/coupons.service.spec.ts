import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from './coupons.service';

describe('CouponsService', () => {
  let service: CouponsService;

  const coupon = {
    id: 'c1',
    code: 'SAVE10',
    type: CouponType.PERCENTAGE,
    value: 10,
    minOrderValue: null,
    maxDiscount: null,
    usageLimit: null,
    usedCount: 0,
    perUserLimit: 1,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    description: null,
    storeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    db: {
      coupon: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      couponUsage: { count: jest.fn() },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<CouponsService>(CouponsService);
  });

  it('applies a percentage coupon to a subtotal', async () => {
    prisma.db.coupon.findFirst.mockResolvedValue(coupon);
    prisma.db.couponUsage.count.mockResolvedValue(0);

    const result = await service.apply('save10', 'user-1', 100);
    expect(result).toEqual({ couponId: 'c1', discount: 10 });
  });

  it('throws for an unknown coupon code', async () => {
    prisma.db.coupon.findFirst.mockResolvedValue(null);
    await expect(service.apply('NOPE', 'user', 100)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the per-user usage limit has been reached', async () => {
    prisma.db.coupon.findFirst.mockResolvedValue(coupon);
    prisma.db.couponUsage.count.mockResolvedValue(1);
    await expect(service.apply('save10', 'user', 100)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws for an expired coupon', async () => {
    prisma.db.coupon.findFirst.mockResolvedValue({ ...coupon, expiresAt: new Date(Date.now() - 1000) });
    prisma.db.couponUsage.count.mockResolvedValue(0);
    await expect(service.apply('save10', 'user', 100)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caps a percentage discount at the maxDiscount value', async () => {
    prisma.db.coupon.findFirst.mockResolvedValue({ ...coupon, maxDiscount: 25 });
    prisma.db.couponUsage.count.mockResolvedValue(0);
    const result = await service.apply('save10', 'user', 1000);
    expect(result.discount).toBe(25);
  });
});