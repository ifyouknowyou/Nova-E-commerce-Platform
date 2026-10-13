'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { STATIC_CATEGORIES } from '@/lib/static-catalog';

/**
 * AnimatedMegaMenu — 3D perspective mega menu with staggered category entrances.
 * Uses hover-delay to prevent flickering when moving from trigger to dropdown.
 */
export function AnimatedMegaMenu() {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-full'],
    queryFn: async () => STATIC_CATEGORIES,
  });

  const rootCategories = categories.filter((c) => !c.parent);
  const topDeals = [
    { label: 'Flash Sales', href: '/deals?sale=true', desc: 'Curated discounts' },
    { label: 'New Arrivals', href: '/products?sort=newest', desc: 'Just dropped' },
    { label: 'Best Sellers', href: '/products?sort=popular', desc: 'Top picks' },
  ];

  // Safe close with delay to prevent flickering
  const scheduleClose = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={() => scheduleClose()}
    >
      <motion.button
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
          'text-foreground/80 hover:text-foreground transition-colors',
          open && 'text-primary',
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>Shop</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-0 z-50 mt-2 w-[680px]"
            initial={{ opacity: 0, y: 12, rotateX: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, rotateX: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ perspective: 1000 }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {/* Card */}
            <div className="rounded-2xl border bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Header */}
              <div className="border-b px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Categories
                </p>
              </div>

              <div className="grid grid-cols-2 gap-0">
                {/* Left: Categories */}
                <div className="border-r p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-4 animate-pulse rounded bg-muted" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {rootCategories.map((cat, i) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Link
                            href={`/products?categoryId=${cat.id}`}
                            className={cn(
                              'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                              'hover:bg-primary/5 hover:text-primary',
                            )}
                          >
                            <span>{cat.name}</span>
                            {cat._count?.products ? (
                              <span className="text-[10px] text-muted-foreground">
                                {cat._count.products}
                              </span>
                            ) : null}
                          </Link>
                          {/* Sub-categories */}
                          {cat.children && cat.children.length > 0 && (
                            <motion.div
                              className="ml-4 mt-0.5 space-y-0.5 border-l pl-3"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              transition={{ delay: i * 0.03 + 0.05 }}
                            >
                              {cat.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={`/products?categoryId=${child.id}`}
                                  className="block rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Quick links */}
                <div className="p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Quick Links
                  </p>
                  <div className="space-y-1">
                    {topDeals.map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Link
                          href={item.href}
                          className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-primary/5"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary">
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <motion.span
                            className="text-muted-foreground transition-colors group-hover:text-primary"
                            whileHover={{ x: 3 }}
                          >
                            →
                          </motion.span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Decorative */}
                  <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/10 to-success/5 p-3">
                    <p className="text-xs font-semibold text-primary">✨ Hot Deals</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Discover curated discounts
                    </p>
                    <Link
                      href="/deals"
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Browse all deals →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
