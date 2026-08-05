import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReturnStatus, type ReturnRequest } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CreateReturnDto } from './dto/create-return.dto';
import { DecideReturnDto } from './dto/decide-return.dto';

export interface ReturnRow {
  id: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  amount: number;
  reason: string;
  description: string | null;
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
}

/** Only delivered line items are eligible for a return. */
const RETURNABLE_ITEM_STATUSES = new Set(['DELIVERED']);

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  // ── Customer ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateReturnDto): Promise<ReturnRow> {
    const item = await this.prisma.db.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: { order: { select: { userId: true } }, product: { select: { name: true } } },
    });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.order.userId !== userId) throw new ForbiddenException('Not your order');

    if (!RETURNABLE_ITEM_STATUSES.has(item.status)) {
      throw new BadRequestException('Only delivered items can be returned');
    }
    const existing = await this.prisma.db.returnRequest.findUnique({ where: { orderItemId: item.id } });
    if (existing) throw new BadRequestException('A return request already exists for this item');

    // Refunds can never exceed what the customer paid for the item. Amount is
    // client-supplied, so clamp it to the order item's value.
    const amount = Math.min(dto.amount ?? Number(item.total), Number(item.total));
    const created = await this.prisma.db.returnRequest.create({
      data: {
        orderItemId: item.id,
        userId,
        reason: dto.reason,
        description: dto.description,
        amount,
      },
    });

    await this.notify(userId, 'Return requested', `Your return for "${item.product.name}" has been submitted.`);

    return toRow(created, item.product.name, item.quantity);
  }

  async mine(userId: string): Promise<ReturnRow[]> {
    const rows = await this.prisma.db.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItem: { include: { product: { select: { name: true } } } } },
    });
    return rows.map((row) => toRow(row, row.orderItem.product.name, row.orderItem.quantity));
  }

  // ── Admin / seller ───────────────────────────────────────────────────────

  async listAll(
    user: AuthenticatedUser,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    status?: ReturnStatus,
  ): Promise<PaginatedResult<ReturnRow>> {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const isAdmin = user.roleCodes.includes('ADMIN');

    const where: Prisma.ReturnRequestWhereInput = {};
    if (status) where.status = status;
    if (isAdmin) {
      // Admins see every request on the platform.
    } else {
      const store = await this.prisma.db.store.findFirst({
        where: { sellerId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!store) throw new ForbiddenException('You must have a store to manage returns');
      where.orderItem = { storeId: store.id };
    }

    const total = await this.prisma.db.returnRequest.count({ where });
    const rows = await this.prisma.db.returnRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { orderItem: { include: { product: { select: { name: true } } } } },
    });
    return {
      items: rows.map((row) => toRow(row, row.orderItem.product.name, row.orderItem.quantity)),
      meta: pageMeta(total, size, page),
    };
  }

  async decide(user: AuthenticatedUser, returnId: string, dto: DecideReturnDto): Promise<ReturnRow> {
    const request = await this.prisma.db.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        orderItem: { include: { product: { select: { name: true } } } },
        refund: true,
      },
    });
    if (!request) throw new NotFoundException('Return request not found');
    if (request.status !== 'REQUESTED') throw new BadRequestException('This request has already been decided');
    if (request.refund) throw new BadRequestException('A refund is already associated with this request');

    if (!user.roleCodes.includes('ADMIN')) {
      const store = await this.prisma.db.store.findFirst({
        where: { sellerId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!store || request.orderItem.storeId !== store.id) throw new ForbiddenException('Not your store');
    }

    if (dto.decision === 'APPROVED') {
      // Refunds only ever touch a real, PAID payment. No paid payment ⇒ no refund.
      const payment = await this.prisma.db.payment.findFirst({
        where: { orderId: request.orderItem.orderId, status: 'PAID' },
        select: { id: true, amount: true },
      });
      if (!payment) {
        throw new BadRequestException('This order has no paid payment to refund');
      }
      const refundAmount = Number(request.amount) > Number(payment.amount) ? Number(payment.amount) : Number(request.amount);

      const refund = await this.prisma.db.$transaction(async (tx) => {
        const created = await tx.refund.create({
          data: {
            returnRequestId: request.id,
            paymentId: payment.id,
            amount: refundAmount,
            currency: 'USD',
            status: 'PENDING',
            reason: `Return for order item ${request.orderItem.id}`,
            processedById: user.id,
          },
        });
        await tx.returnRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED', adminNote: dto.adminNote ?? null },
        });
        return created;
      });

      let refunded = false;
      try {
        // Real gateway refund (idempotent) — actually moves money back.
        await this.payments.refundPayment(payment.id);
        refunded = true;
      } catch (err) {
        await this.prisma.db.refund.update({
          where: { id: refund.id },
          data: { status: 'FAILED' },
        });
        await this.notify(
          request.userId,
          'Refund failed',
          `We could not process your refund for "${request.orderItem.product.name}". Please contact support.`,
        );
        throw new BadRequestException(`Refund failed: ${(err as Error).message}`);
      }

      if (refunded) {
        // Success: mark refunded, restore stock for the returned item.
        await this.prisma.db.$transaction([
          this.prisma.db.refund.update({ where: { id: refund.id }, data: { status: 'REFUNDED' } }),
          this.prisma.db.returnRequest.update({ where: { id: request.id }, data: { status: 'REFUNDED' } }),
          this.prisma.db.product.update({
            where: { id: request.orderItem.productId },
            data: { stock: { increment: request.orderItem.quantity }, soldCount: { decrement: request.orderItem.quantity } },
          }),
        ]);
        await this.notify(
          request.userId,
          'Refund processed',
          `Your refund of $${refundAmount.toFixed(2)} for "${request.orderItem.product.name}" has been processed.`,
        );
      }
    } else {
      await this.prisma.db.returnRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', adminNote: dto.adminNote ?? null },
      });
      await this.notify(request.userId, 'Return rejected', `Your return request for "${request.orderItem.product.name}" was not approved.`);
    }

    const updated = await this.prisma.db.returnRequest.findUnique({
      where: { id: returnId },
      include: { orderItem: { include: { product: { select: { name: true } } } } },
    });
    if (!updated) throw new NotFoundException('Return request not found');
    return toRow(updated, updated.orderItem.product.name, updated.orderItem.quantity);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async notify(userId: string, title: string, message: string): Promise<void> {
    await this.prisma.db.notification.create({
      data: { userId, type: 'RETURN', title, message },
    });
  }
}

function toRow(row: ReturnRequest, productName: string, quantity: number): ReturnRow {
  return {
    id: row.id,
    orderItemId: row.orderItemId,
    productName,
    quantity,
    amount: Number(row.amount),
    reason: row.reason,
    description: row.description,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
  };
}

function pageMeta(total: number, size: number, page: number) {
  return {
    page,
    pageSize: size,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / size)),
    hasNextPage: page * size < total,
    hasPrevPage: page > 1,
  };
}
