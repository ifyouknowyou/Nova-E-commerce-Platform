'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { CategoryNode } from '@/lib/api/types';
import { cn } from '@/lib/utils';

function flatten(cats: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (list: CategoryNode[], depth: number) => {
    for (const c of list) {
      out.push(c);
      if (c.children?.length) walk(c.children, depth + 1);
    }
  };
  walk(cats, 0);
  return out;
}

/**
 * Category mega menu for the primary nav. Loads the real category tree from
 * the existing `/categories` endpoint (same query key as the listing page, so
 * it is shared, not duplicated). Opens on hover/focus, closes on outside click.
 */
export function MegaMenu() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<CategoryNode[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });

  const [open, setOpen] = useState(false);
  const flat = flatten(categories ?? []);

  // Split top-level and nested for a two-column flyout.
  const topLevel = flat.filter((c) => c.children && c.children.length > 0).slice(0, 6);
  const children = flat.filter((c) => c.children && c.children.length === 0).slice(0, 12);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/products"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        Shop
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[560px] -translate-x-1/2 rounded-xl border bg-popover p-4 text-popover-foreground depth-2 animate-pop">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              <ul className="mt-2 space-y-0.5">
                {topLevel.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?categoryId=${cat.id}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {cat.children?.length ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Popular
              </p>
              <ul className="mt-2 space-y-0.5">
                {children.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?categoryId=${cat.id}`}
                      className="block truncate rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/products"
                className="mt-3 block rounded-md bg-primary/10 px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
              >
                Browse everything →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
