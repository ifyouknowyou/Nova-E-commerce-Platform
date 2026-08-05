'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticated } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  image: string | null;
  addedAt: string;
}

const KEY = ['wishlist'] as const;

export const wishlistApi = {
  list(): Promise<WishlistItem[]> {
    return apiFetch<WishlistItem[]>('/wishlist');
  },
  add(productId: string): Promise<{ message: string }> {
    return apiFetch(`/wishlist/${productId}`, { method: 'POST' });
  },
  remove(productId: string): Promise<{ message: string }> {
    return apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
  },
};

export function useWishlist() {
  const queryClient = useQueryClient();
  // Wishlist is account-bound — don't hit the auth-only endpoint for guests
  // (it would 401 + trigger a pointless refresh on every page render).
  const { authed, ready } = useAuthenticated();
  const { data: items = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: wishlistApi.list,
    enabled: ready && authed,
  });
  const add = useMutation({ mutationFn: wishlistApi.add, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
  const remove = useMutation({ mutationFn: wishlistApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
  const isWishlisted = (productId: string) => items.some((item) => item.productId === productId);
  return { items, isLoading, add: add.mutateAsync, remove: remove.mutateAsync, isWishlisted, refetch: () => queryClient.invalidateQueries({ queryKey: KEY }) };
}