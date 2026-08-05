import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EXCLUDE_ROLES_KEY } from '../decorators/exclude-roles.decorator';

@Injectable()
export class ExcludeRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const excluded = this.reflector.getAllAndOverride<string[]>(EXCLUDE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!excluded || excluded.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: { roleCodes?: string[] } }>();
    const roleCodes = request.user?.roleCodes ?? [];

    const forbidden = roleCodes.some((role) => excluded.includes(role));
    if (forbidden) throw new ForbiddenException('Not allowed for administrator accounts');
    return true;
  }
}