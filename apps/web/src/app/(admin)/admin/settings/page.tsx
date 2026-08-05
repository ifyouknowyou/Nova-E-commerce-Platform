'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { settingsApi } from '@/lib/settings';

const GROUPS = ['general', 'store', 'currency', 'taxes', 'shipping', 'payment', 'email', 'seo'] as const;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: settingsApi.all });

  const save = useMutation({
    mutationFn: ({ group, values }: { group: string; values: Record<string, unknown> }) => settingsApi.update(group, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Settings saved');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Platform-wide configuration"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5" /> {Object.keys(data ?? {}).length} groups
          </span>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          {GROUPS.map((group) => (
            <TabsTrigger key={group} value={group} className="capitalize">{group}</TabsTrigger>
          ))}
        </TabsList>
        {GROUPS.map((group) => (
          <TabsContent key={group} value={group}>
            <GroupEditor
              group={group}
              values={data?.[group] ?? {}}
              saving={save.isPending}
              onSave={(values) => void save.mutate({ group, values })}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function GroupEditor({ group, values, saving, onSave }: { group: string; values: Record<string, unknown>; saving: boolean; onSave: (values: Record<string, unknown>) => void }) {
  const [draft, setDraft] = useState<Record<string, unknown>>(values);

  const entries = Object.entries(values);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base capitalize">{group}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([key, value]) => (
          <SettingField key={key} name={key} value={value} onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))} />
        ))}
        <Button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingField({ name, value, onChange }: { name: string; value: unknown; onChange: (value: unknown) => void }) {
  const label = name.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, (c) => c.toUpperCase());
  const bool = typeof value === 'boolean';
  const num = typeof value === 'number';

  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={`field-${name}`} className="flex-1 capitalize">{label}</Label>
      {bool ? (
        <Switch id={`field-${name}`} checked={value as boolean} onCheckedChange={onChange} />
      ) : (
        <Input
          id={`field-${name}`}
          className="max-w-[260px]"
          type={num ? 'number' : 'text'}
          step={num ? '0.01' : undefined}
          value={String(value ?? '')}
          onChange={(e) => onChange(num ? Number(e.target.value) : e.target.value)}
        />
      )}
    </div>
  );
}
