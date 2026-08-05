import { apiFetch } from '@/lib/api';
import type { PaginatedResult } from '@/lib/api/types';

export interface AdminOverview {
  revenue: number;
  orders: number;
  customers: number;
  sellers: number;
  pendingProducts: number;
  pendingReviews: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  emailVerified: boolean;
  roles: string[];
  orderCount: number;
  createdAt: string;
}

export interface AdminSeller {
  id: string;
  name: string;
  slug: string;
  status: string;
  commissionRate: number;
  seller: { id: string; email: string; name: string | null; status: string };
  productCount: number;
  orderCount: number;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  store: { name: string };
}

export interface AdminOrder {
  id: string;
  invoiceNumber: string | null;
  email: string;
  status: string;
  paymentStatus: string;
  total: number;
  placedAt: string;
  itemCount: number;
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  productId: string;
  createdAt: string;
}

export const adminApi = {
  overview(): Promise<AdminOverview> {
    return apiFetch('/admin/overview');
  },
  users(q: string, page = 1): Promise<PaginatedResult<AdminUser>> {
    return apiFetch(`/admin/users?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${page}`);
  },
  sellers(page = 1): Promise<PaginatedResult<AdminSeller>> {
    return apiFetch(`/admin/sellers?page=${page}`);
  },
  setSellerStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{ id: string; status: string }> {
    return apiFetch(`/admin/sellers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  deleteSeller(id: string): Promise<{ message: string }> {
    return apiFetch(`/admin/sellers/${id}`, { method: 'DELETE' });
  },
  auditLogs(page = 1): Promise<PaginatedResult<AdminAuditLog>> {
    return apiFetch(`/admin/audit-logs?page=${page}`);
  },
  setUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'): Promise<unknown> {
    return apiFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  products(status: string, page = 1): Promise<PaginatedResult<AdminProduct>> {
    return apiFetch(`/admin/products?${status ? `status=${status}&` : ''}page=${page}`);
  },
  moderateProduct(id: string, status: 'APPROVED' | 'REJECTED'): Promise<unknown> {
    return apiFetch(`/admin/products/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status }) });
  },
  toggleFeatured(id: string): Promise<unknown> {
    return apiFetch(`/admin/products/${id}/feature`, { method: 'POST' });
  },
  orders(page = 1): Promise<PaginatedResult<AdminOrder>> {
    return apiFetch(`/admin/orders?page=${page}`);
  },
  reviews(status: string, page = 1): Promise<PaginatedResult<AdminReview>> {
    return apiFetch(`/admin/reviews?${status ? `status=${status}&` : ''}page=${page}`);
  },
  moderateReview(id: string, status: 'APPROVED' | 'HIDDEN'): Promise<unknown> {
    return apiFetch(`/admin/reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status }) });
  },

  // Categories
  categories(): Promise<AdminCategory[]> {
    return apiFetch('/admin/categories');
  },
  createCategory(input: CategoryInput): Promise<unknown> {
    return apiFetch('/admin/categories', { method: 'POST', body: JSON.stringify(input) });
  },
  updateCategory(id: string, input: Partial<CategoryInput>): Promise<unknown> {
    return apiFetch(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  deleteCategory(id: string): Promise<{ message: string }> {
    return apiFetch(`/admin/categories/${id}`, { method: 'DELETE' });
  },

  // Brands
  brands(): Promise<AdminBrand[]> {
    return apiFetch('/admin/brands');
  },
  createBrand(input: BrandInput): Promise<unknown> {
    return apiFetch('/admin/brands', { method: 'POST', body: JSON.stringify(input) });
  },
  updateBrand(id: string, input: Partial<BrandInput>): Promise<unknown> {
    return apiFetch(`/admin/brands/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  deleteBrand(id: string): Promise<{ message: string }> {
    return apiFetch(`/admin/brands/${id}`, { method: 'DELETE' });
  },
};

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parent: { id: string; name: string } | null;
  sortOrder: number;
  isActive: boolean;
  deletedAt: string | null;
  productCount: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
}

export interface BrandInput {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}