'use client';

import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 max-h-screen translate-x-0 translate-y-0 glass-strong sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold tracking-tight">
            NOVA<span className="text-primary">.</span>
          </DialogTitle>
        </DialogHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
