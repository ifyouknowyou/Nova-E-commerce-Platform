'use client';

import { ShieldCheck, Sparkles, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { SceneContainer } from '@/components/3d/scene-container';
import { cn } from '@/lib/utils';

/**
 * 3D scene backdrop for the account profile surface. Composes the shared
 * scene primitives — role-aware aurora wash, a receding grid floor, film
 * grain, and a subtle pointer-tracked depth tilt (all reduced-motion safe).
 * The accent palette follows the signed-in role (admin → its cyan/blue glow,
 * seller → green, customer → blue) through data-role CSS variables; no
 * backend involvement.
 */
export function ProfileScene({ children }: { children: ReactNode }) {
  return (
    <SceneContainer grid aurora noise parallax={2} className="rounded-2xl bg-role-glow">
      {/* Floating depth accents — decorative, never block interaction */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <FloatingChip
          className="tz-40 right-6 top-5"
          delay="-1s"
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          label="Protected"
        />
        <FloatingChip
          className="tz-20 bottom-24 right-12"
          delay="-4s"
          icon={<Star className="h-4 w-4 text-success" />}
          label="Trusted"
        />
        <FloatingChip
          className="tz-neg-16 left-4 top-16"
          delay="-2.5s"
          icon={<Sparkles className="h-4 w-4 text-warning" />}
          label="NOVA"
        />
      </div>

      {/* Profile content sits above the backdrop */}
      <div className="relative z-10 space-y-6 p-5 sm:p-6">{children}</div>
    </SceneContainer>
  );
}

function FloatingChip({
  className,
  delay,
  icon,
  label,
}: {
  className?: string;
  delay: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className={cn('absolute animate-float-deep', className)} style={{ animationDelay: delay }}>
      <div className="flex items-center gap-2 rounded-xl border bg-card/85 px-3 py-2 text-xs font-medium text-foreground/80 backdrop-blur-md depth-2 shadow-xl">
        {icon}
        {label}
      </div>
    </div>
  );
}