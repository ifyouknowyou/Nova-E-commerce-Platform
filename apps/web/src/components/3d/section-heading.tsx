import { cn } from '@/lib/utils';

/** Consistent storefront/dashboard section heading with a kicker + action slot. */
export function SectionHeading({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>
        ) : null}
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-base text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
