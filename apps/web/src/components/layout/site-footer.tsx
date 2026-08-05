import { Sparkles } from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'Deals', href: '/deals' },
      { label: 'New arrivals', href: '/products?sort=newest' },
      { label: 'Wishlist', href: '/wishlist' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My orders', href: '/account/orders' },
      { label: 'Track an order', href: '/account/track' },
      { label: 'Returns', href: '/help/returns' },
      { label: 'Help center', href: '/help' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Become a seller', href: '/sell' },
      { label: 'Seller dashboard', href: '/dashboard' },
      { label: 'Fees & policies', href: '/help/seller-policies' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t bg-muted/30">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold tracking-tight">
              NOVA<span className="text-primary">.</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              A premium multi-vendor marketplace. Shop trusted products from independent
              sellers with secure payments and fast delivery.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Verified sellers · Buyer protection
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NOVA Commerce. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Built with care for customers and sellers.</p>
        </div>
      </div>
    </footer>
  );
}
