'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { controlCenterApi } from '@/lib/control-center';
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
import { AlertCircle, Search } from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['control-center', 'customers', search],
    queryFn: () =>
      controlCenterApi.customers(search || undefined),
  });

  const customers = data ?? [];

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Customers"
          subtitle="View and manage your customer directory."
        />
      </Reveal3D>

      {/* Search */}
      <Reveal3D delay={0.1}>
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Input
              placeholder="Search customers by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </Reveal3D>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load customers. Please try again.
          </span>
          <button onClick={() => refetch()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* Customers Table */}
      <Reveal3D delay={0.2}>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime Value</TableHead>
                <TableHead>Last Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Search className="mx-auto h-6 w-6 mb-2 opacity-50" />
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer: { email: string; name: string | null; orders: number; lifetimeValue: number; lastOrderAt: string | null }) => (
                  <TableRow key={customer.email}>
                    <TableCell className="font-medium">{customer.email}</TableCell>
                    <TableCell className="text-sm">{customer.name ?? 'N/A'}</TableCell>
                    <TableCell className="text-sm">{customer.orders}</TableCell>
                    <TableCell className="font-medium text-lg">{customer.lifetimeValue.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{customer.lastOrderAt ?? 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Reveal3D>
    </div>
  );
}