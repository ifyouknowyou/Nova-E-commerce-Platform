import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QUOTE_STATUSES, type QuoteStatus } from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get('products')
  @RequirePermissions('sales.product.read')
  @ApiOperation({ summary: 'List products.' })
  products(@Req() req: Req) {
    return this.sales.products(req.user!.orgId);
  }

  @Post('products')
  @RequirePermissions('sales.product.create')
  @ApiOperation({ summary: 'Create a product.' })
  createProduct(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.sales.createProduct(req.user!.orgId, body);
  }

  @Get('quotes')
  @RequirePermissions('sales.quote.read')
  @ApiOperation({ summary: 'List quotes.' })
  quotes(@Req() req: Req) {
    return this.sales.quotes(req.user!.orgId);
  }

  @Get('quotes/:id')
  @RequirePermissions('sales.quote.read')
  @ApiOperation({ summary: 'Quote detail with line items.' })
  quote(@Req() req: Req, @Param('id') id: string) {
    return this.sales.quoteDetail(req.user!.orgId, id);
  }

  @Post('quotes')
  @RequirePermissions('sales.quote.create')
  @ApiOperation({ summary: 'Create a quote from line items (totals computed server-side).' })
  createQuote(@Req() req: Req, @Body() body: {
    number: string; contactId?: string; companyId?: string; validUntil?: string; taxRate?: number; items: { productId?: string; description: string; qty: number; unitPrice: number }[];
  }) {
    if (!body.items || !body.items.length) throw new ApiException('VALIDATION_FAILED', { message: 'quote needs at least one item' });
    return this.sales.createQuote(req.user!.orgId, req.user!.userId, body);
  }

  @Post('quotes/:id/send')
  @RequirePermissions('sales.quote.update')
  @ApiOperation({ summary: 'Send a quote (DRAFT → SENT).' })
  send(@Req() req: Req, @Param('id') id: string) {
    return this.sales.sendQuote(req.user!.orgId, id);
  }

  @Post('quotes/:id/status')
  @RequirePermissions('sales.quote.update')
  @ApiOperation({ summary: 'Set a quote status (e.g. ACCEPTED/DECLINED).' })
  setStatus(@Req() req: Req, @Param('id') id: string, @Body() body: { status: string }) {
    if (!(QUOTE_STATUSES as readonly string[]).includes(body.status)) throw new ApiException('VALIDATION_FAILED');
    return this.sales.updateQuoteStatus(req.user!.orgId, id, body.status as QuoteStatus);
  }

  @Get('targets')
  @RequirePermissions('sales.target.read')
  @ApiOperation({ summary: 'List sales targets.' })
  targets(@Req() req: Req) {
    return this.sales.targets(req.user!.orgId);
  }

  @Post('targets')
  @RequirePermissions('sales.target.update')
  @ApiOperation({ summary: 'Upsert a sales target for a period.' })
  upsertTarget(@Req() req: Req, @Body() body: { period: string; amount: number; ownerId?: string }) {
    return this.sales.upsertTarget(req.user!.orgId, body);
  }
}

interface Req {
  user?: AuthenticatedUser;
}