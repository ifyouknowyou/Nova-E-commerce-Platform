import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from '@nexus/shared';
import { WorkflowDispatcher } from '../automation/workflow.dispatcher';
import { ApiException } from '../common/exceptions';
import { NotificationsService } from '../hooks/notifications.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { InventoryService, MovementInput } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly dispatcher: WorkflowDispatcher,
  ) {}

  @Get('categories')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'List product categories.' })
  categories(@Req() req: Req) {
    return this.inventory.categories(req.user!.orgId);
  }

  @Post('categories')
  @RequirePermissions('inventory.category.update')
  @ApiOperation({ summary: 'Create a product category.' })
  createCategory(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.inventory.createCategory(req.user!.orgId, body);
  }

  @Get('suppliers')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'List suppliers.' })
  suppliers(@Req() req: Req) {
    return this.inventory.suppliers(req.user!.orgId);
  }

  @Post('suppliers')
  @RequirePermissions('inventory.supplier.update')
  @ApiOperation({ summary: 'Create a supplier.' })
  createSupplier(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.inventory.createSupplier(req.user!.orgId, body);
  }

  @Get('warehouses')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'List warehouses.' })
  warehouses(@Req() req: Req) {
    return this.inventory.warehouses(req.user!.orgId);
  }

  @Post('warehouses')
  @RequirePermissions('inventory.warehouse.update')
  @ApiOperation({ summary: 'Create a warehouse.' })
  createWarehouse(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.inventory.createWarehouse(req.user!.orgId, body);
  }

  @Get('locations')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'List stock locations.' })
  locations(@Req() req: Req) {
    return this.inventory.locations(req.user!.orgId);
  }

  @Post('locations')
  @RequirePermissions('inventory.warehouse.update')
  @ApiOperation({ summary: 'Create a stock location.' })
  createLocation(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.inventory.createLocation(req.user!.orgId, body);
  }

  @Get('stock')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'Current stock levels (optionally low/reorder only).' })
  stock(@Req() req: Req, @Query('lowOnly') lowOnly?: string) {
    return this.inventory.stock(req.user!.orgId, lowOnly === 'true');
  }

  @Post('stock/movements')
  @RequirePermissions('inventory.stock.movement')
  @ApiOperation({ summary: 'Record an immutable stock movement (IN/OUT/ADJUST/TRANSFER).' })
  async movement(@Req() req: Req, @Body() body: MovementInput & { type: string }) {
    if (!(STOCK_MOVEMENT_TYPES as readonly string[]).includes(body.type)) throw new ApiException('VALIDATION_FAILED');
    const type = body.type as StockMovementType;
    return this.inventory.movement(req.user!.orgId, req.user!.userId, type, body, async (p) => {
      await this.notifications.notify(req.user!.orgId, {
        type: 'WARNING', title: `Low stock: ${p.name}`, body: 'Re-order is due.',
      });
      await this.dispatcher.emit(req.user!.orgId, 'INVENTORY_LOW', {
        productId: p.id, productName: p.name, actorId: req.user!.userId,
      });
    });
  }

  @Get('stock/movements')
  @RequirePermissions('inventory.product.read')
  @ApiOperation({ summary: 'Stock movement ledger (immutable, append-only).' })
  movements(@Req() req: Req, @Query('productId') productId?: string) {
    return this.inventory.movements(req.user!.orgId, productId);
  }
}

interface Req {
  user?: AuthenticatedUser;
}