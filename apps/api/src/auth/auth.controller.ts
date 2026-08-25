import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { CONFIG, type AppConfig } from '../config/configuration';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import { REFRESH_COOKIE, clearAuthCookies, parseCookies, setAuthCookies } from './cookies';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { RedisService } from '../redis/redis.service';
import { AuthService, type AuthResult } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import type { GoogleProfileUser } from './strategies/google.strategy';

const OAUTH_CODE_TTL_SECONDS = 60;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly redis: RedisService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  @Get('me')
  @Public()
  me(@CurrentUser() user?: AuthenticatedUser) {
    if (!user) return {};
    return { id: user.id, email: user.email, roles: user.roleCodes };
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  // Brute-force protection for the 6-digit email verification code.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.code);
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  // 10 requests per minute — enough for register → verify → login flow
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, dto.rememberMe ?? false);
    setAuthCookies(res, this.config, result.accessToken, result.refreshToken, result.rememberMe);
    return this.withoutRefreshToken(result);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto | undefined, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Prefer the httpOnly refresh cookie; fall back to the body token.
    const token = dto?.refreshToken || parseCookies(req.headers.cookie)[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const result = await this.auth.refresh(token);
    setAuthCookies(res, this.config, result.accessToken, result.refreshToken, result.rememberMe);
    return this.withoutRefreshToken(result);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto | undefined, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto?.refreshToken || parseCookies(req.headers.cookie)[REFRESH_COOKIE];
    if (token) await this.auth.logout(token).catch(() => undefined);
    clearAuthCookies(res, this.config);
    return { message: 'Signed out' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    clearAuthCookies(res, this.config);
    return { message: 'Signed out everywhere' };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Redirects to Google; guard handles the flow.
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const profile = req.user as GoogleProfileUser;
    if (!profile?.email) {
      res.redirect(`${this.config.webUrl}/login?error=oauth_missing_email`);
      return;
    }

    const result = await this.auth.googleLogin(profile);
    const code = randomBytes(32).toString('base64url');
    await this.redis.set(`oauth:${code}`, result, OAUTH_CODE_TTL_SECONDS);
    res.redirect(`${this.config.webUrl}/oauth/callback?code=${code}`);
  }

  @Post('oauth/exchange')
  @Public()
  @HttpCode(HttpStatus.OK)
  async exchangeOAuth(@Body() dto: OAuthExchangeDto, @Res({ passthrough: true }) res: Response): Promise<Omit<AuthResult, 'refreshToken'>> {
    const result = await this.redis.get<AuthResult>(`oauth:${dto.code}`);
    if (!result) throw new UnauthorizedException('Invalid or expired OAuth code');
    await this.redis.del(`oauth:${dto.code}`);
    setAuthCookies(res, this.config, result.accessToken, result.refreshToken, result.rememberMe);
    return this.withoutRefreshToken(result);
  }

  /**
   * Sessions live in httpOnly cookies, so the long-lived refresh token must
   * never reach client JS where XSS could read and persist it. The short-lived
   * access token stays for Bearer flows / tooling.
   */
  private withoutRefreshToken(result: AuthResult): Omit<AuthResult, 'refreshToken'> {
    const { refreshToken: _refreshToken, ...safe } = result;
    return safe;
  }
}
