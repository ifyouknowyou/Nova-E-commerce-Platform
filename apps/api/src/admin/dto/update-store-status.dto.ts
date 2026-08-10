import { IsIn } from 'class-validator';

const STORE_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export class UpdateStoreStatusDto {
  @IsIn(STORE_STATUSES, { message: 'Status must be ACTIVE or SUSPENDED' })
  status!: (typeof STORE_STATUSES)[number];
}
