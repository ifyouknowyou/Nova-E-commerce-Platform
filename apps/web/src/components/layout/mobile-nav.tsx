'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LINKS = [
  { label: 'Shop', href: '/products' },
  { label: 'Deals', href: '/deals' },
  { label: 'Sell', href: '/sell' },
  { label: 'Help', href: '/help' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Cart', href: '/cart' },
  { label: 'Sign in', href: '/login' },
  { label: 'Create account', href: '/register' },
];

/**
 * AnimatedMobileNav — 3D slide-in panel with staggered link animations.
 */
export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-0 right-0 h-full w-[280px] translate-x-0 border-l bg-background/95 backdrop-blur-xl sm:max-w-sm"
        // modal={false}
      >
        <div className="flex flex-col gap-1 p-4 pt-12">
          <DialogTitle className="pb-4 text-lg font-bold tracking-tight">
            NOVA<span className="text-primary">.</span>
          </DialogTitle>

          <AnimatePresence initial={false}>
            {LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                    'text-foreground/80 hover:bg-primary/5 hover:text-primary',
                  )}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Decorative footer */}
          <div className="mt-auto pt-6">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-success/5 p-3">
              <p className="text-xs font-semibold text-primary">✨ Fresh Deals</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Up to 70% off this week only
              </p>
              <Link
                href="/deals"
                onClick={() => onOpenChange(false)}
                className="mt-2 block text-xs font-medium text-primary hover:underline"
              >
                Shop now →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
