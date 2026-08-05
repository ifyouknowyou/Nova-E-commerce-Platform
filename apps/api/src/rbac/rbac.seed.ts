import { PERMISSIONS, type Permission, type RoleCode } from '@nova/shared';

export interface RoleSeed {
  code: RoleCode;
  name: string;
  description: string;
  permissions: Permission[];
}

const P = PERMISSIONS;

const allPermissions: Permission[] = [
  P.products.read,
  P.products.create,
  P.products.update,
  P.products.delete,
  P.products.approve,
  P.categories.manage,
  P.brands.manage,
  P.cart.manage,
  P.checkout.manage,
  P.orders.read,
  P.orders.update,
  P.orders.refund,
  P.coupons.manage,
  P.reviews.manage,
  P.users.manage,
  P.sellers.manage,
  P.store.manage,
  P.inventory.manage,
  P.analytics.read,
  P.reports.read,
  P.settings.manage,
  P.roles.manage,
];

export const RBAC_SEED: RoleSeed[] = [
  {
    code: 'CUSTOMER',
    name: 'Customer',
    description: 'Purchases from the marketplace.',
    permissions: [
      P.products.read,
      P.cart.manage,
      P.checkout.manage,
      P.orders.read,
    ],
  },
  {
    code: 'SELLER',
    name: 'Seller',
    description: 'Runs a store on the marketplace.',
    permissions: [
      P.products.read,
      P.products.create,
      P.products.update,
      P.products.delete,
      P.store.manage,
      P.inventory.manage,
      P.orders.read,
      P.orders.update,
      P.orders.refund,
      P.coupons.manage,
      P.analytics.read,
    ],
  },
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'Full platform access.',
    permissions: allPermissions,
  },
];
