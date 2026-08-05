'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuthenticated } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  authorName: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export function ReviewsSection({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => apiFetch<{ items: Review[] }>(`/products/${productId}/reviews`),
  });
  const { authed, ready } = useAuthenticated();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      apiFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setComment('');
      toast.success('Review submitted');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit review'),
  });

  const reviews = data?.items ?? [];

  return (
    <section aria-label="Customer reviews">
      <h2 className="text-xl font-bold">Customer reviews</h2>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : reviews.length > 0 ? (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                </div>
                {review.title && <p className="mt-2 font-medium">{review.title}</p>}
                {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {review.authorName}{review.isVerifiedPurchase ? ' · Verified purchase' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      )}

      {ready && authed && (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-4">
            <p className="font-medium">Write a review</p>
            <div className="flex items-center gap-1" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  onClick={() => setRating(value)}
                >
                  <Star className={`h-5 w-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (only verified purchasers can post)"
            />
            <Button onClick={() => void submit.mutate()} disabled={submit.isPending || !comment.trim()}>
              Submit review
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}