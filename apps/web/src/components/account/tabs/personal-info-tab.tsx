'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usersApi, type UserProfile } from '@/lib/profile';
import { formatDate } from '@/lib/utils';
import { SectionCard } from '../ui';

export function PersonalInfoTab({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
  }, [profile]);

  const save = useMutation({
    mutationFn: () => usersApi.update({ name: name.trim() || undefined, phone: phone.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update profile'),
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title="Basic information"
        description="This is what customers and platform staff see about you."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="personal-name">Full name</Label>
            <Input
              id="personal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personal-phone">Phone</Label>
            <Input
              id="personal-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Account details" description="Read-only information about your account.">
        <dl className="divide-y rounded-lg border">
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="truncate text-sm font-medium">{profile.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">Member ID</dt>
            <dd className="font-mono text-sm">{profile.id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">Member since</dt>
            <dd className="text-sm font-medium">{formatDate(profile.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">Account status</dt>
            <dd className="text-sm font-medium capitalize">{profile.status.toLowerCase()}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
