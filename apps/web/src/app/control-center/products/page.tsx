'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { controlCenterApi } from '@/lib/control-center';
import type { ProductSummary } from '@/lib/control-center';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  APPROVED: 'bg-green-500/10 text-green-600 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  ARCHIVED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['control-center', 'products', page, search, status],
    queryFn: () =>
      controlCenterApi.products({
        page,
        pageSize: 20,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const products = data?.data ?? [];
  const rawMeta = data?.meta;
  const meta = rawMeta ? {
    ...rawMeta,
    totalPages: Math.max(1, Math.ceil(rawMeta.total / rawMeta.pageSize)),
    hasPrevPage: rawMeta.page > 1,
    hasNextPage: rawMeta.page * rawMeta.pageSize < rawMeta.total,
    totalItems: rawMeta.total,
  } : null;

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Products"
          subtitle="Manage your product catalog, pricing, and inventory."
        />
      </Reveal3D>

      {/* Filters */}
      <Reveal3D delay={0.1}>
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </Reveal3D>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load products. Please try again.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Products Table */}
      <Reveal3D delay={0.2}>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: ProductSummary) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                    <TableCell>{product.unitsSold}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={product.stock <= 5 ? 'bg-red-500/10 text-red-600 border-red-500/20' : ''}
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Reveal3D>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((meta.page - 1) * meta.pageSize) + 1} to{' '}
            {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
