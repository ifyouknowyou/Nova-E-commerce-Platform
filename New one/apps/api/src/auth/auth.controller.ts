import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { REFRESH_COOKIE } from '@nexus/shared';
import { setSessionCookies, clearSessionCookies } from '../common/cookies';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto/auth.dto';

function metaFrom(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const ua = req.headers['user-agent'];
  return { ip: req.ip, userAgent: Array.isArray(ua) ? ua[0] : ua };
}

function refreshTokenFrom(req: { cookies?: Record<string, string> }) {
  return req.cookies?.[REFRESH_COOKIE];
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('sign-up')
  @ApiOperation({ summary: 'Create an account + organization (sets session cookies).' })
  async signUp(@Body() dto: SignUpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.signUp(dto, metaFrom(req as never));
    setSessionCookies(res, session.accessToken, session.refreshToken, session.csrf);
    return { user: session.user };
  }

  @Public()
  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in (sets session cookies).' })
  async signIn(@Body() dto: SignInDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.signIn(dto, metaFrom(req as never));
    setSessionCookies(res, session.accessToken, session.refreshToken, session.csrf);
    return { user: session.user };
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out (revokes refresh session, clears cookies).' })
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.signOut(
      refreshTokenFrom(req as never),
      metaFrom(req as never),
      (req as never as { user?: AuthenticatedUser }).user?.userId,
    );
    clearSessionCookies(res);
    return { ok: true };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh cookie into a fresh access session.' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.refresh(refreshTokenFrom(req as never), metaFrom(req as never));
    if (!session) {
      clearSessionCookies(res);
      return { user: null };
    }
    setSessionCookies(res, session.accessToken, session.refreshToken, session.csrf);
    return { user: session.user };
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address with a one-time token.' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token).then(() => ({ ok: true }));
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link (never reveals account existence).' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, metaFrom(req as never)).then(() => ({ ok: true }));
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password with a one-time reset token.' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, metaFrom(req as never)).then(() => ({ ok: true }));
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change the authenticated user’s password.' })
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const user = (req as never as { user?: AuthenticatedUser }).user!;
    return this.authService.changePassword(dto, user.userId, user.orgId, metaFrom(req as never)).then(() => ({ ok: true }));
  }

  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated principal + tenant context.' })
  async me(@Req() req: Request) {
    const user = (req as never as { user?: AuthenticatedUser }).user!;
    const dbUser = await this.prisma.client.user.findUnique({
      where: { id: user.userId },
      select: { email: true, emailVerifiedAt: true },
    });
    return {
      userId: user.userId,
      orgId: user.orgId,
      roles: user.roles,
      email: dbUser?.email ?? '',
      emailVerified: Boolean(dbUser?.emailVerifiedAt),
    };
  }
}
