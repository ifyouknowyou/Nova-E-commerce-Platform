'use client';

import { Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCountdown } from '@/lib/use-countdown';
import { cn } from '@/lib/utils';

/** "Coming soon" pill with a compact release countdown. Renders nothing once released. */
export function ComingSoonBadge({
  releaseDate,
  className,
}: {
  releaseDate: string | null;
  className?: string;
}) {
  const { released, days, hours, minutes } = useCountdown(releaseDate);
  if (released || !releaseDate) return null;

  const remaining =
    days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : 'releases soon';

  return (
    <Badge variant="secondary" className={cn('gap-1 text-xs shadow', className)}>
      <Clock3 className="h-3 w-3" />
      Coming soon · {remaining}
    </Badge>
  );
}