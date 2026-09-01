'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { controlCenterApi } from '@/lib/control-center';
import type { CategoryDirectoryRow } from '@/lib/control-center';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package } from 'lucide-react';

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['control-center', 'categories'],
    queryFn: () => controlCenterApi.categories(),
  });

  const categories = data ?? [];

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Categories"
          subtitle="Manage your product categories and hierarchy."
        />
      </Reveal3D>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load categories. Please try again.
          </span>
          <button onClick={() => refetch()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* Categories List */}
      <Reveal3D delay={0.1}>
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-dashed border-gray-200">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
              No categories found
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                {categories.map((category: CategoryDirectoryRow) => (
                  <div key={category.id} className="flex items-center p-3 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.productCount} products
                        {category.parentId && ` · Parent: ${category.parentId}`}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">{category.slug}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal3D>
    </div>
  );
}