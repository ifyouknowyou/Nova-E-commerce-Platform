'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi } from '@/lib/admin';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('PENDING');
  const { data } = useQuery({ queryKey: ['admin-reviews', tab], queryFn: () => adminApi.reviews(tab) });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'HIDDEN' }) => adminApi.moderateReview(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review moderated');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Moderate customer reviews" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass">
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="HIDDEN">Hidden</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {data?.items.map((review) => (
          <SpatialPanel key={review.id} depth={2} spotlight className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                ))}
              </div>
              <p className="mt-1 line-clamp-2 text-sm">{review.comment ?? 'No comment'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{review.status.toLowerCase()}</Badge>
              {review.status === 'PENDING' && (
                <>
                  <Button size="sm" onClick={() => void moderate.mutate({ id: review.id, status: 'APPROVED' })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => void moderate.mutate({ id: review.id, status: 'HIDDEN' })}>Hide</Button>
                </>
              )}
            </div>
          </SpatialPanel>
        ))}
        {(data?.items.length ?? 0) === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No {tab.toLowerCase()} reviews.</p>
        )}
      </div>
    </div>
  );
}