import { Sparkles } from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'Deals', href: '/deals' },
      { label: 'New arrivals', href: '/products?sort=newest' },
      { label: 'Collections', href: '/collections' },
    ],
  },
  { title: 'Support', links: [{ label: 'Help center', href: '/help' }] },
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
      {/* Enhanced footer top glow line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
      >
        <div className="h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
      </div>

      {/* Ambient glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute -left-32 bottom-0 h-48 w-48 rounded-full bg-success/5 blur-[60px]" />
      </div>

      <div className="page-container py-12 relative">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold tracking-tight">
              NOVA<span className="text-primary">.</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Explore a bundled sample catalog and sign in to your NOVA account.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Bundled products · Locally hosted artwork
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
                      className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:translate-x-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} NOVA Commerce. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Built with care for curious shoppers.</p>
        </div>
      </div>
    </footer>
  );
}
