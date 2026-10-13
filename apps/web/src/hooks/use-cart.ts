'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CartResponse } from '@/lib/api/types';
import { cartApi } from '@/lib/cart';
import { STATIC_CATALOG_MODE } from '@/lib/static-catalog';

const CART_KEY = ['cart'] as const;

/** Cart state + mutations backed by the API (guest sessions supported). */
export function useCart() {
  const queryClient = useQueryClient();

  const { data: cart, isLoading, isError } = useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.get,
    enabled: !STATIC_CATALOG_MODE,
  });

  const setCart = (next: CartResponse) => queryClient.setQueryData(CART_KEY, next);

  const addItem = useMutation({
    mutationFn: (input: { productId: string; quantity?: number }) =>
      cartApi.add(input.productId, input.quantity),
    onSuccess: setCart,
  });

  const updateItem = useMutation({
    mutationFn: (input: { itemId: string; data: { quantity?: number; savedForLater?: boolean } }) =>
      cartApi.update(input.itemId, input.data),
    onSuccess: setCart,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartApi.remove(itemId),
    onSuccess: setCart,
  });

  const mergeGuest = useMutation({
    mutationFn: () => cartApi.merge(),
    onSuccess: setCart,
  });

  return {
    cart,
    itemCount: cart?.itemCount ?? 0,
    isLoading,
    isError,
    addItem: addItem.mutateAsync,
    addingItem: addItem.isPending,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
    mergeGuest: mergeGuest.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  };
}
