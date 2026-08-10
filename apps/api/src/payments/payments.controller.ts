import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Param, Post, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { PaymentsService, type PaymentProviderResponse } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Stripe webhook — verified signature, idempotent. Public by design. */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Raw body required for webhook verification');
    return this.payments.handleWebhook(req.rawBody, signature);
  }

  @Post(':orderId/start')
  @HttpCode(HttpStatus.OK)
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ): Promise<PaymentProviderResponse> {
    return this.payments.start(this.require(user), orderId);
  }

  @Post(':orderId/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.confirm(this.require(user), orderId);
  }

  private require(user: AuthenticatedUser | undefined): string {
    if (!user) throw new UnauthorizedException('Sign in required');
    return user.id;
  }
}