import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import { ReportsService } from './reports.service';

const DEFAULT_DAYS = 30;

@Controller('reports')
@Roles('ADMIN')
@Permissions('reports:read')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('revenue')
  revenue(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reports.revenue(range.from, range.to);
  }

  @Get('sales')
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reports.sales(range.from, range.to);
  }

  @Get('orders')
  orders(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reports.ordersByStatus(range.from, range.to);
  }

  @Get('customers')
  customers(@Query('limit') limit?: string) {
    return this.reports.topCustomers(limit ? Number(limit) : 10);
  }

  @Get('sellers')
  sellers(@Query('limit') limit?: string) {
    return this.reports.topSellers(limit ? Number(limit) : 10);
  }

  @Get('inventory')
  inventory() {
    return this.reports.inventory();
  }

  @Get('coupons')
  coupons() {
    return this.reports.coupons();
  }

  @Get('reviews')
  reviews() {
    return this.reports.reviews();
  }
}

function parseRange(from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const fromDate = from ? parseDate(from, 'from') : new Date(now.getTime() - DEFAULT_DAYS * 86_400_000);
  const toDate = to ? parseDate(to, 'to') : now;
  if (fromDate > toDate) throw new BadRequestException('"from" must be before "to"');
  return { from: fromDate, to: toDate };
}

function parseDate(value: string, name: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`Invalid ${name} date`);
  return date;
}
