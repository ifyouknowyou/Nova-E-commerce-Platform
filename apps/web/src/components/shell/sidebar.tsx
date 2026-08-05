'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  /** Visual tone of the shell — each role passes its own. */
  accent?: 'default' | 'command';
}

/**
 * Enterprise sidebar with collapsible groups, active indicators, tooltips, and
 * a mobile drawer. Both seller and admin shells reuse this; the `accent` prop
 * plus the role theme make each look distinct.
 */
export function Sidebar({ groups, accent = 'default' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Dashboard navigation"
        className={cn(
          'hidden lg:block',
          collapsed ? 'w-16' : 'w-60',
          'transition-[width] duration-300 ease-out',
          accent === 'command' && 'mr-4 border-r pr-3',
        )}
        data-accent={accent}
      >
        <div
          className={cn(
            'sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-1 py-6',
            collapsed ? 'items-center' : 'px-3',
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent',
              collapsed && 'justify-center px-0',
            )}
          >
            <PanelLeft className="h-4 w-4" />
            {!collapsed && <span>Collapse</span>}
          </button>

          <TooltipProvider delayDuration={200}>
            <nav className="flex w-full flex-col gap-3 overflow-y-auto scroll-thin">
              {groups.map((group, gi) => (
                <div key={group.title ?? gi}>
                  {group.title && !collapsed && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                              active
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              collapsed && 'justify-center px-0',
                            )}
                            aria-current={active ? 'page' : undefined}
                          >
                            <span
                              className={cn(
                                'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                                active ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                            {!collapsed && item.badge && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </nav>
          </TooltipProvider>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-muted-foreground"
          aria-label="Open dashboard navigation"
        >
          <PanelLeft className="h-4 w-4" />
          Navigation
        </button>
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Dashboard navigation"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-lg font-bold tracking-tight">
                    NOVA<span className="text-primary">.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                    aria-label="Close navigation"
                  >
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {groups.map((group, gi) => (
                    <div key={group.title ?? gi} className="mb-2">
                      {group.title && (
                        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {group.title}
                        </p>
                      )}
                      {group.items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium',
                              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent',
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/** Groups header used above the sidebar in layouts. */
export function SidebarHeading({ children }: { children: ReactNode }) {
  return <div className="hidden lg:block">{children}</div>;
}
