import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Role → badge color mapping (shared by header, account layout, profile). */
const ROLE_BADGES: Record<string, string> = {
  CUSTOMER: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  SELLER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  ADMIN: 'Admin',
};

/** Displays a role code as a colored badge with a human label. */
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const label = ROLE_LABEL[role] ?? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  return (
    <Badge className={cn('text-xs', ROLE_BADGES[role] ?? 'bg-muted text-muted-foreground', className)}>
      {label}
    </Badge>
  );
}
