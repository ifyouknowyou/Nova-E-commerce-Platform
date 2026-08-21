import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { AddressesService, type AddressResponse } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AddressResponse[]> {
    return this.addresses.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto): Promise<AddressResponse> {
    return this.addresses.create(user.id, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponse> {
    return this.addresses.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.addresses.remove(user.id, id);
  }
}
