'use client';

import Link from 'next/link';
import type { NavLinkItem } from '@/lib/nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RoleBadge } from './role-badge';

/** A titled group of links in the account dropdown (e.g. "Account", "Seller"). */
export interface AccountNavSection {
  title: string;
  items: NavLinkItem[];
}

/** Status → badge treatment. */
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-success text-success-foreground' },
  SUSPENDED: { label: 'Suspended', className: 'bg-warning text-warning-foreground' },
  BANNED: { label: 'Banned', className: 'bg-danger text-danger-foreground' },
};

interface AccountBarProps {
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  status?: string;
  roles?: string[];
  /** 0–1 completion used for the progress ring + label. */
  completion?: number;
  /** Role-scoped quick links, grouped into labeled sections under the identity. */
  sections?: AccountNavSection[];
  onNavigate?: () => void;
  footer?: React.ReactNode;
}

/**
 * Advanced account profile bar: avatar, name, role badges, account status,
 * profile-completion ring, and role-scoped quick links. Used in the header
 * dropdown and account shell so the same identity block is consistent.
 */
export function AccountBar({
  name,
  email,
  avatarUrl,
  status,
  roles = [],
  completion = 0,
  sections = [],
  onNavigate,
  footer,
}: AccountBarProps) {
  const initials = (name ?? email ?? '?').slice(0, 2).toUpperCase();
  const statusConfig = status ? (STATUS_BADGE[status] ?? { label: status, className: 'bg-muted' }) : null;
  const pct = Math.max(0, Math.min(1, completion));
  const ringDash = `${(pct * 88).toFixed(0)} 88`;

  return (
    <div>
      {/* Identity row */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? email} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <svg
            className="absolute -right-1 -bottom-1 h-5 w-5 -rotate-90"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="14" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray={ringDash}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name ?? 'No name set'}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
            {statusConfig ? (
              <Badge className={cn('text-xs', statusConfig.className)}>{statusConfig.label}</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Completion meter */}
      {completion > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Profile completion</span>
            <span className="font-semibold text-primary">{Math.round(pct * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
      )}

      {/* Role-scoped nav, grouped by section so account/seller/admin links are
          never conflated and no link can appear twice. */}
      {sections.length > 0 && (
        <div className="mt-3 border-t pt-2">
          {sections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-2 border-t pt-2' : ''}>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {footer ? <div className="mt-2 border-t pt-2">{footer}</div> : null}
    </div>
  );
}
