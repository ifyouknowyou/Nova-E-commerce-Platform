'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { sellerApi } from '@/lib/seller';
import { EmptyState, SectionCard } from '../ui';

export function BusinessTab() {
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });

  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (store) {
      setContactEmail(store.contactEmail ?? '');
      setBio(store.bio ?? '');
    }
  }, [store]);

  const save = useMutation({
    mutationFn: () => sellerApi.updateStore({ contactEmail: contactEmail.trim() || undefined, bio: bio.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      toast.success('Business information updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save changes'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <EmptyState icon={Briefcase} title="No store yet" description="Create a store to manage business information." />
    );
  }

  return (
    <SectionCard title="Business information" description="Contact and company details for platform verification.">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="business-email">Business contact email</Label>
          <Input
            id="business-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="support@yourstore.com"
          />
          <p className="text-xs text-muted-foreground">Used for order enquiries and verification.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-bio">Business description</Label>
          <Textarea
            id="business-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell buyers what your store is about."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => void save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
