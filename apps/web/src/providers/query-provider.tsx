'use client';

import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { PRODUCTS_CHANGE_EVENT } from '@/lib/api';
import { getQueryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ProductsInvalidation />
      {children}
    </QueryClientProvider>
  );
}

/**
 * Keep storefront product lists fresh when a product is removed (admin or
 * seller delete). Without this, react-query serves the cached list — which
 * still contains the just-archived product — until it next refetches.
 */
function ProductsInvalidation() {
  const queryClient = useQueryClient();
  useEffect(() => {
    function onProductsChange() {
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    }
    window.addEventListener(PRODUCTS_CHANGE_EVENT, onProductsChange);
    return () => window.removeEventListener(PRODUCTS_CHANGE_EVENT, onProductsChange);
  }, [queryClient]);
  return null;
}
