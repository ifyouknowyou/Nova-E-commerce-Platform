import { apiFetch } from '@/lib/api';

export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  createdAt: string;
}

export const sellerApi = {
  // Store
  getMyStore(): Promise<StoreResponse | null> {
    return apiFetch<StoreResponse | null>('/stores/me');
  },
  createStore(input: { name: string; slug?: string; bio?: string }): Promise<StoreResponse> {
    return apiFetch<StoreResponse>('/stores', { method: 'POST', body: JSON.stringify(input) });
  },
  updateStore(input: { name?: string; bio?: string; contactEmail?: string }): Promise<StoreResponse> {
    return apiFetch<StoreResponse>('/stores/me', { method: 'PATCH', body: JSON.stringify(input) });
  },

  // Products
  listProducts(page = 1, pageSize = 20): Promise<PaginatedResponse<SellerProduct>> {
    return apiFetch(`/seller/products?page=${page}&pageSize=${pageSize}`);
  },
  createProduct(input: SellerProductInput): Promise<unknown> {
    return apiFetch('/seller/products', { method: 'POST', body: JSON.stringify(input) });
  },
  updateProduct(id: string, input: Partial<SellerProductInput>): Promise<unknown> {
    return apiFetch(`/seller/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  /** Send a product back into the admin moderation queue. */
  submitForReview(id: string): Promise<{ id: string; status: string }> {
    return apiFetch(`/seller/products/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'PENDING' }) });
  },
  deleteProduct(id: string): Promise<{ message: string }> {
    return apiFetch(`/seller/products/${id}`, { method: 'DELETE' });
  },
  updateInventory(id: string, stock: number, lowStockThreshold: number): Promise<{ stock: number }> {
    return apiFetch(`/seller/products/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ stock, lowStockThreshold }),
    });
  },

  // Product images
  uploadImage(file: File): Promise<{ key: string; url: string; contentType: string }> {
    const form = new FormData();
    form.append('file', file);
    return apiFetch('/uploads/images', { method: 'POST', body: form as never });
  },
  addProductImages(productId: string, images: { key: string; alt?: string }[]): Promise<unknown> {
    return apiFetch(`/seller/products/${productId}/images`, {
      method: 'POST',
      body: JSON.stringify({ images }),
    });
  },
  setPrimaryImage(productId: string, imageId: string): Promise<unknown> {
    return apiFetch(`/seller/products/${productId}/images/${imageId}/primary`, { method: 'POST' });
  },
  removeImage(productId: string, imageId: string): Promise<unknown> {
    return apiFetch(`/seller/products/${productId}/images/${imageId}`, { method: 'DELETE' });
  },

  // Analytics
  analytics(): Promise<{ revenue: number; orderCount: number; aov: number; topProducts: { productId: string; revenue: number; sold: number }[] }> {
    return apiFetch('/seller/analytics');
  },

  // Orders
  listOrders(page = 1, pageSize = 20): Promise<PaginatedResponse<SellerOrder>> {
    return apiFetch(`/seller/orders?page=${page}&pageSize=${pageSize}`);
  },
  updateOrderStatus(id: string, status: string): Promise<unknown> {
    return apiFetch(`/seller/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  // Catalog
  categories(): Promise<unknown[]> {
    return apiFetch('/categories');
  },
};

export interface PaginatedResponse<T> {
  items: T[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  releaseDate: string | null;
  createdAt: string;
  images: { id: string; url: string; isPrimary: boolean }[];
}

export interface SellerProductInput {
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  categoryId: string;
  brandId?: string;
  description?: string;
  lowStockThreshold?: number;
  /** ISO release date ('' or null clears it — the product is available immediately). */
  releaseDate?: string | null;
}

export interface SellerOrder {
  id: string;
  orderId: string;
  name: string;
  quantity: number;
  total: number;
  status: string;
  placedAt: string;
}