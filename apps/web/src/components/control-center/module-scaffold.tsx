'use client';

import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SpatialPanel } from '@/components/3d/spatial-panel';

interface ModuleScaffoldProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Short list of what this module will expose (shown as a checklist). */
  planned?: string[];
}

/**
 * Coherent "coming soon" surface for Control Center modules not yet wired to a
 * real API. Keeps the nav tree complete and the design language consistent.
 */
export function ModuleScaffold({ title, description, icon: Icon, planned }: ModuleScaffoldProps) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle={description} />
      <Reveal3D>
        <SpatialPanel depth={4} spotlight className="p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">On the roadmap</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This module is part of the Command Center surface and will be wired to live data in a
                later pass. The navigation and access control are already in place.
              </p>
              {planned && planned.length > 0 && (
                <ul className="mt-4 grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
                  {planned.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SpatialPanel>
      </Reveal3D>
    </div>
  );
}
