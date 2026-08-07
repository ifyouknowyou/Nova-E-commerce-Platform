import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PAYMENT_METHODS, type PaymentMethod } from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('accounts')
  @RequirePermissions('finance.account.read')
  @ApiOperation({ summary: 'List accounts.' })
  accounts(@Req() req: Req) {
    return this.finance.accounts(req.user!.orgId);
  }

  @Post('accounts')
  @RequirePermissions('finance.account.update')
  @ApiOperation({ summary: 'Create an account.' })
  createAccount(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.finance.createAccount(req.user!.orgId, body);
  }

  @Get('transactions')
  @RequirePermissions('finance.account.read')
  @ApiOperation({ summary: 'List transactions.' })
  transactions(@Req() req: Req) {
    return this.finance.transactions(req.user!.orgId);
  }

  @Get('invoices')
  @RequirePermissions('finance.invoice.read')
  @ApiOperation({ summary: 'List invoices.' })
  invoices(@Req() req: Req) {
    return this.finance.invoices(req.user!.orgId);
  }

  @Get('invoices/:id')
  @RequirePermissions('finance.invoice.read')
  @ApiOperation({ summary: 'Invoice detail with items + payments.' })
  invoice(@Req() req: Req, @Param('id') id: string) {
    return this.finance.invoiceDetail(req.user!.orgId, id);
  }

  @Post('invoices')
  @RequirePermissions('finance.invoice.create')
  @ApiOperation({ summary: 'Create an invoice from line items (totals server-computed).' })
  createInvoice(@Req() req: Req, @Body() body: {
    number: string; companyId?: string; contactId?: string; dueDate?: string; taxRate?: number;
    items: { description: string; qty: number; unitPrice: number }[];
  }) {
    if (!body.items || !body.items.length) throw new ApiException('VALIDATION_FAILED', { message: 'invoice needs at least one item' });
    return this.finance.createInvoice(req.user!.orgId, req.user!.userId, body);
  }

  @Post('invoices/:id/payments')
  @RequirePermissions('finance.payment.create')
  @ApiOperation({ summary: 'Record a payment against an invoice (recomputes status).' })
  recordPayment(@Req() req: Req, @Param('id') id: string, @Body() body: { amount: number; method?: string; reference?: string; date?: string }) {
    if (body.method && !(PAYMENT_METHODS as readonly string[]).includes(body.method)) throw new ApiException('VALIDATION_FAILED');
    return this.finance.recordPayment(req.user!.orgId, id, { ...body, method: body.method as PaymentMethod });
  }

  @Get('expenses')
  @RequirePermissions('finance.expense.read')
  @ApiOperation({ summary: 'List expenses.' })
  expenses(@Req() req: Req) {
    return this.finance.expenses(req.user!.orgId);
  }

  @Post('expenses')
  @RequirePermissions('finance.expense.create')
  @ApiOperation({ summary: 'Create an expense.' })
  createExpense(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.finance.createExpense(req.user!.orgId, body);
  }

  @Get('vendors')
  @RequirePermissions('finance.expense.read')
  @ApiOperation({ summary: 'List vendors.' })
  vendors(@Req() req: Req) {
    return this.finance.vendors(req.user!.orgId);
  }

  @Post('vendors')
  @RequirePermissions('finance.expense.create')
  @ApiOperation({ summary: 'Create a vendor.' })
  createVendor(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.finance.createVendor(req.user!.orgId, body);
  }
}

interface Req {
  user?: AuthenticatedUser;
}