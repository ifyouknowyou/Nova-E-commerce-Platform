import { apiFetch } from '@/lib/api';

export type AddressType = 'SHIPPING' | 'BILLING';

export interface Address {
  id: string;
  type: AddressType;
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

export interface AddressInput {
  type?: AddressType;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export const addressesApi = {
  list(): Promise<Address[]> {
    return apiFetch<Address[]>('/addresses');
  },
  create(input: AddressInput): Promise<Address> {
    return apiFetch<Address>('/addresses', { method: 'POST', body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<AddressInput>): Promise<Address> {
    return apiFetch<Address>(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  remove(id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/addresses/${id}`, { method: 'DELETE' });
  },
};
