import { Injectable } from '@nestjs/common';
import { StockMovementType } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

export interface MovementInput {
  productId: string;
  locationId: string;
  type: StockMovementType;
  qty: number; // always positive
  note?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Inventory — categories, suppliers, warehouses, locations, stock levels and
 * the IMMUTABLE stock-movement ledger.
 *
 * Stock invariant (spec): every qty change is an append-only StockMovement; an
 * OUT can never drive stock below 0. The update is an atomic, conditional
 * `updateMany ... where { qty: { gte: n } }` so a concurrent/short balance can
 * never go negative (no check-then-act race).
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Catalog CRUD ----------------------------------------------------------
  async categories(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.productCategory.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }
  async createCategory(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.productCategory.create({ data: { ...data, orgId } as never }));
  }
  async suppliers(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.supplier.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }
  async createSupplier(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.supplier.create({ data: { ...data, orgId } as never }));
  }
  async warehouses(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.warehouse.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }
  async createWarehouse(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.warehouse.create({ data: { ...data, orgId } as never }));
  }
  async locations(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.stockLocation.findMany({ where: { orgId } }));
  }
  async createLocation(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.stockLocation.create({ data: { ...data, orgId } as never }));
  }

  // ---- Stock ---------------------------------------------------------------
  /** Current stock levels with product info. `lowOnly` surfaces reorder items. */
  async stock(orgId: string, lowOnly = false) {
    return this.prisma.withTenant(orgId, async (tx) => {
      const products = await tx.product.findMany({ where: { orgId } });
      const levels = await tx.stockLevel.findMany({ where: { orgId } });
      const joined = levels.map((l) => {
        const prod = products.find((p) => p.id === l.productId);
        return {
          id: l.id, productId: l.productId, locationId: l.locationId, qty: l.qty,
          productName: prod?.name ?? '', reorderLevel: prod?.reorderLevel ?? 0, sku: prod?.sku ?? null,
        };
      });
      return lowOnly ? joined.filter((r) => r.qty <= r.reorderLevel) : joined;
    });
  }

  /** Immutable stock movement — the heart of the no-negative invariant. */
  async movement(orgId: string, createdById: string | undefined, type: StockMovementType, input: MovementInput, onLowStock?: (p: { id: string; name: string }) => void) {
    const qty = Number(input.qty);
    if (!Number.isInteger(qty) || qty <= 0) throw new ApiException('VALIDATION_FAILED', { message: 'qty must be a positive integer' });

    return this.prisma.withTenant(orgId, async (tx) => {
      const product = await tx.product.findFirst({ where: { id: input.productId, orgId } });
      if (!product) throw new ApiException('NOT_FOUND');

      const key = { productId: input.productId, locationId: input.locationId };

      if (type === 'OUT') {
        // Atomic, conditional decrement — blocks any OUT that would go negative.
        const applied = await tx.stockLevel.updateMany({
          where: { ...key, qty: { gte: qty } },
          data: { qty: { decrement: qty } },
        });
        if (applied.count === 0) throw new ApiException('CONFLICT', { message: 'insufficient stock — OUT would go negative' });
      } else {
        const current = await tx.stockLevel.findUnique({ where: { productId_locationId: key } });
        await tx.stockLevel.upsert({
          where: { productId_locationId: key },
          update: { qty: (current?.qty ?? 0) + qty },
          create: { orgId, ...key, qty },
        });
      }

      // Append the immutable ledger row (never edited/deleted).
      await tx.stockMovement.create({
        data: {
          orgId, productId: input.productId, locationId: input.locationId, type,
          qty, note: input.note, referenceType: input.referenceType, referenceId: input.referenceId, createdById,
        },
      });

      const level = await tx.stockLevel.findUnique({ where: { productId_locationId: key } });
      if (level && level.qty <= product.reorderLevel) onLowStock?.({ id: product.id, name: product.name });

      return { productId: input.productId, qty: level?.qty ?? qty };
    });
  }

  /** Append-only ledger for a product (immutability is by construction). */
  async movements(orgId: string, productId?: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.stockMovement.findMany({
        where: { orgId, ...(productId ? { productId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    );
  }
}