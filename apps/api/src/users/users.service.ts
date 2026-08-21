import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@nova/db';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  status: string;
  roles: string[];
  createdAt: string;
}

export interface SecurityResponse {
  emailVerified: boolean;
  hasPassword: boolean;
  googleLinked: boolean;
  lastLoginAt: string | null;
  status: string;
}

export interface NotificationPreferencesResponse {
  emailEnabled: boolean;
  orderEvents: boolean;
  marketing: boolean;
  security: boolean;
  lowStock: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const roles = await this.rbac.getRolesForUser(user.id);
    return this.toProfile(user, roles);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileResponse> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.avatarKey !== undefined) data.avatarKey = dto.avatarKey || null;

    const user = await this.prisma.db.user.update({ where: { id: userId }, data });
    const roles = await this.rbac.getRolesForUser(user.id);
    await this.prisma.db.auditLog.create({
      data: { userId, action: 'profile.update', entityType: 'user', entityId: userId },
    });
    return this.toProfile(user, roles);
  }

  async getSecurity(userId: string): Promise<SecurityResponse> {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    return {
      emailVerified: user.emailVerifiedAt !== null,
      hasPassword: user.passwordHash !== null,
      googleLinked: user.googleId !== null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      status: user.status,
    };
  }

  async getPermissions(userId: string): Promise<{ permissions: string[] }> {
    const roles = await this.rbac.getRolesForUser(userId);
    const permissions = await this.rbac.getPermissionsForRoles(roles);
    return { permissions };
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesResponse> {
    const prefs = await this.prisma.db.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return this.toPrefs(prefs);
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<NotificationPreferencesResponse> {
    const create: Prisma.NotificationPreferenceUncheckedCreateInput = { userId };
    const update: Prisma.NotificationPreferenceUpdateInput = {};
    if (dto.emailEnabled !== undefined) {
      create.emailEnabled = dto.emailEnabled;
      update.emailEnabled = dto.emailEnabled;
    }
    if (dto.orderEvents !== undefined) {
      create.orderEvents = dto.orderEvents;
      update.orderEvents = dto.orderEvents;
    }
    if (dto.marketing !== undefined) {
      create.marketing = dto.marketing;
      update.marketing = dto.marketing;
    }
    if (dto.security !== undefined) {
      create.security = dto.security;
      update.security = dto.security;
    }
    if (dto.lowStock !== undefined) {
      create.lowStock = dto.lowStock;
      update.lowStock = dto.lowStock;
    }

    const prefs = await this.prisma.db.notificationPreference.upsert({
      where: { userId },
      create,
      update,
    });
    return this.toPrefs(prefs);
  }

  private toProfile(user: User, roles: string[]): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarKey: user.avatarKey,
      avatarUrl: user.avatarKey ? mediaUrl(user.avatarKey) : null,
      emailVerified: user.emailVerifiedAt !== null,
      status: user.status,
      roles,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toPrefs(prefs: {
    emailEnabled: boolean;
    orderEvents: boolean;
    marketing: boolean;
    security: boolean;
    lowStock: boolean;
  }): NotificationPreferencesResponse {
    return {
      emailEnabled: prefs.emailEnabled,
      orderEvents: prefs.orderEvents,
      marketing: prefs.marketing,
      security: prefs.security,
      lowStock: prefs.lowStock,
    };
  }
}
