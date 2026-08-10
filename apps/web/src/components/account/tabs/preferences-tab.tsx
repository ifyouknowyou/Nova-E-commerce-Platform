'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usersApi, type NotificationPreferences } from '@/lib/profile';
import { ErrorState, SectionCard } from '../ui';

const PREF_FIELDS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  { key: 'emailEnabled', title: 'Email notifications', description: 'Receive account and store emails.' },
  { key: 'orderEvents', title: 'Order updates', description: 'Order confirmation, shipping and delivery updates.' },
  { key: 'security', title: 'Security alerts', description: 'New sign-ins, password changes and suspicious activity.' },
  { key: 'lowStock', title: 'Low stock alerts', description: 'Get notified when your products run low.' },
  { key: 'marketing', title: 'Marketing', description: 'Occasional news, deals and promotions.' },
];

export function PreferencesTab() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading, isError, refetch } = useQuery({
    queryKey: ['preferences'],
    queryFn: usersApi.preferences,
  });
  const [values, setValues] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (prefs) setValues(prefs);
  }, [prefs]);

  const save = useMutation({
    mutationFn: (next: NotificationPreferences) => usersApi.updatePreferences(next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences saved');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save preferences'),
  });

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your preferences."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading || !values) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const toggle = (key: keyof NotificationPreferences) => {
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    save.mutate(next);
  };

  return (
    <SectionCard title="Notification preferences" description="Choose which emails and alerts you want to receive.">
      <div className="divide-y rounded-lg border">
        {PREF_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{field.title}</p>
              <p className="text-sm text-muted-foreground">{field.description}</p>
            </div>
            <Switch
              checked={values[field.key]}
              onCheckedChange={() => toggle(field.key)}
              disabled={save.isPending}
              aria-label={field.title}
            />
          </div>
        ))}
      </div>
      {save.isPending ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </p>
      ) : null}
    </SectionCard>
  );
}
