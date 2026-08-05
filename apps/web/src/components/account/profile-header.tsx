'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { RoleBadge } from '@/components/3d/role-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usersApi, type UserProfile } from '@/lib/profile';
import { cn, formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'border-transparent bg-emerald-600 text-white' },
  SUSPENDED: { label: 'Suspended', className: 'border-transparent bg-amber-500 text-white' },
  BANNED: { label: 'Banned', className: 'border-transparent bg-red-600 text-white' },
};

export function ProfileHeader({
  profile,
  storeStatus,
}: {
  profile: UserProfile;
  storeStatus?: string | null;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const updateAvatar = useMutation({
    mutationFn: async (file: File) => {
      const key = await usersApi.uploadAvatar(file);
      return usersApi.update({ avatarKey: key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Avatar updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Avatar upload failed'),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await updateAvatar.mutateAsync(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const initials = (profile.name ?? profile.email ?? '?').slice(0, 2).toUpperCase();
  const status = STATUS_BADGE[profile.status] ?? { label: profile.status, className: '' };
  const roles = profile.roles;

  return (
    <div className="overflow-hidden rounded-xl border bg-card depth-1">
      {/* Banner */}
      <div className="h-20 bg-role-glow" />
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <div className="-mt-14 shrink-0">
          <div className="relative h-24 w-24">
            <Avatar className="h-24 w-24 border-4 border-background shadow">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.name ?? profile.email} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label="Upload profile photo"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight">{profile.name ?? 'No name set'}</h1>
            {roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </span>
            {profile.phone ? <span>{profile.phone}</span> : null}
            <span>Member since {formatDate(profile.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              ID {profile.id.slice(0, 8)}
            </Badge>
            <Badge className={cn('text-xs', status.className)}>{status.label}</Badge>
            {profile.emailVerified ? (
              <Badge variant="success" className="text-xs">
                Email verified
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs">
                Email unverified
              </Badge>
            )}
            {storeStatus ? (
              <Badge variant="outline" className="text-xs capitalize">
                Store: {storeStatus.toLowerCase()}
              </Badge>
            ) : null}
            {roles.includes('ADMIN') ? (
              <Badge variant="outline" className="inline-flex items-center gap-1 text-xs">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
