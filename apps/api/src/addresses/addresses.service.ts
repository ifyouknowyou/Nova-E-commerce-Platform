import { Injectable, NotFoundException } from '@nestjs/common';
import type { Address } from '@nova/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

export interface AddressResponse {
  id: string;
  type: 'SHIPPING' | 'BILLING';
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /** All of a user's non-deleted addresses, default first. */
  async list(userId: string): Promise<AddressResponse[]> {
    const rows = await this.prisma.db.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toResponse(row));
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressResponse> {
    if (dto.isDefault) await this.clearDefault(userId);
    const row = await this.prisma.db.address.create({
      data: {
        userId,
        type: dto.type ?? 'SHIPPING',
        label: dto.label,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        phone: dto.phone,
        isDefault: dto.isDefault ?? false,
      },
    });
    return this.toResponse(row);
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<AddressResponse> {
    await this.requireOwned(userId, id);
    if (dto.isDefault) await this.clearDefault(userId);
    const row = await this.prisma.db.address.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.line1 !== undefined ? { line1: dto.line1 } : {}),
        ...(dto.line2 !== undefined ? { line2: dto.line2 } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    });
    return this.toResponse(row);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.requireOwned(userId, id);
    await this.prisma.db.address.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Address removed' };
  }

  /** Un-mark every other address so `isDefault` stays unique per user. */
  private async clearDefault(userId: string): Promise<void> {
    await this.prisma.db.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  private async requireOwned(userId: string, id: string): Promise<Address> {
    const address = await this.prisma.db.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private toResponse(row: Address): AddressResponse {
    return {
      id: row.id,
      type: row.type,
      label: row.label,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      phone: row.phone,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
