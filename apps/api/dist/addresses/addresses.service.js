"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AddressesService = class AddressesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /** All of a user's non-deleted addresses, default first. */
    async list(userId) {
        const rows = await this.prisma.db.address.findMany({
            where: { userId, deletedAt: null },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        return rows.map((row) => this.toResponse(row));
    }
    async create(userId, dto) {
        if (dto.isDefault)
            await this.clearDefault(userId);
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
    async update(userId, id, dto) {
        await this.requireOwned(userId, id);
        if (dto.isDefault)
            await this.clearDefault(userId);
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
    async remove(userId, id) {
        await this.requireOwned(userId, id);
        await this.prisma.db.address.update({ where: { id }, data: { deletedAt: new Date() } });
        return { message: 'Address removed' };
    }
    /** Un-mark every other address so `isDefault` stays unique per user. */
    async clearDefault(userId) {
        await this.prisma.db.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    async requireOwned(userId, id) {
        const address = await this.prisma.db.address.findFirst({ where: { id, userId, deletedAt: null } });
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        return address;
    }
    toResponse(row) {
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
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map