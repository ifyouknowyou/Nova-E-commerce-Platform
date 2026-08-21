import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<NotificationResponse>> {
    const size = Math.min(100, pageSize);
    const where = { userId, isArchived: false };
    const total = await this.prisma.db.notification.count({ where });
    const rows = await this.prisma.db.notification.findMany({
      where,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * size,
      take: size,
    });
    return {
      items: rows.map((row) => this.toResponse(row)),
      meta: {
        page,
        pageSize: size,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / size)),
        hasNextPage: page * size < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await this.prisma.db.notification.count({ where: { userId, isRead: false, isArchived: false } });
    return { unread };
  }

  async markRead(userId: string, id: string): Promise<{ message: string }> {
    const notification = await this.prisma.db.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.prisma.db.notification.update({ where: { id }, data: { isRead: true } });
    return { message: 'Marked read' };
  }

  async markAllRead(userId: string): Promise<{ message: string }> {
    await this.prisma.db.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked read' };
  }

  async create(userId: string, type: string, title: string, message: string, data?: unknown): Promise<void> {
    await this.prisma.db.notification.create({ data: { userId, type, title, message, data: (data as never) ?? undefined } });
  }

  private toResponse(row: {
    id: string; type: string; title: string; message: string; data: unknown; isRead: boolean; createdAt: Date;
  }): NotificationResponse {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    };
  }
}