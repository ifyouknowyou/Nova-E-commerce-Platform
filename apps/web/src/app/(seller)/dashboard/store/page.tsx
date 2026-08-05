'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sellerApi } from '@/lib/seller';

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (store) {
      setName(store.name);
      setBio(store.bio ?? '');
    }
  }, [store]);

  const save = useMutation({
    mutationFn: () => sellerApi.updateStore({ name, bio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      toast.success('Store updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-xl">
      <PageHeader title="Store settings" subtitle="Manage your store profile" />

      <Card className="mt-6 overflow-hidden depth-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" /> Public profile
          </CardTitle>
          <CardDescription>This is how your store appears to customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-bio">Description</Label>
            <Textarea id="store-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your store" />
          </div>
          {store && (
            <p className="text-xs text-muted-foreground">
              Public URL:{' '}
              <Link href={`/stores/${store.slug}`} className="text-primary hover:underline">
                /stores/{store.slug}
              </Link>
            </p>
          )}
          <Button onClick={() => void save.mutate()} disabled={save.isPending || !name.trim()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}