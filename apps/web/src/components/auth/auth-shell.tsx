import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Premium auth page shell. Gives login/register/verify flows a consistent
 * brand identity: soft role-aware gradient wash, floating ambient glows, a
 * branded card with layered depth, and a trust footer. Purely presentational.
 */
export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  icon,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-role-soft">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
        {/* Brand */}
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </p>

        {/* Card */}
        <div className="mt-5 w-full overflow-hidden rounded-2xl border bg-card text-card-foreground depth-2 hairline">
          <div className="border-b bg-muted/30 px-6 py-5">
            {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div> : null}
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{title}</h1>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="px-6 py-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Trusted by independent sellers and verified buyers worldwide.
        </p>
      </div>
    </div>
  );
}
