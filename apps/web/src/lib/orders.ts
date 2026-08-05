import { apiFetch } from '@/lib/api';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  status: string;
}

export interface OrderDetail {
  id: string;
  invoiceNumber: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  trackingNumber: string | null;
  placedAt: string;
  shippingMethod: string | null;
  shippingPostalCode: string | null;
  items: OrderItem[];
  timeline: { id: string; status: string; note: string | null; createdAt: string }[];
}

export interface OrderSummary {
  id: string;
  invoiceNumber: string | null;
  status: string;
  total: number;
  placedAt: string;
  items: { name: string; quantity: number }[];
}

export interface ShippingInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CheckoutOrderInput {
  shipping: ShippingInput;
  shippingMethod: 'standard' | 'express';
  couponCode?: string;
  notes?: string;
}

export const ordersApi = {
  checkout(input: CheckoutOrderInput): Promise<OrderDetail> {
    return apiFetch<OrderDetail>('/orders', { method: 'POST', body: JSON.stringify(input) });
  },
  list(): Promise<OrderSummary[]> {
    return apiFetch<OrderSummary[]>('/orders');
  },
  detail(id: string): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/orders/${id}`);
  },
  cancel(id: string): Promise<OrderDetail> {
    return apiFetch<OrderDetail>(`/orders/${id}/cancel`, { method: 'POST' });
  },
};