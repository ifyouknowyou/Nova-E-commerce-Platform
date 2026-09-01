'use client';

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthenticated } from '@/hooks/use-auth';
import { searchApi, type SearchSuggestion } from '@/lib/search';
import { formatCurrency } from '@/lib/utils';
import { AnimatedCartButton } from './animated-cart-button';
import { AnimatedMegaMenu } from './animated-mega-menu';
import { MobileNav } from './mobile-nav';

const NAV_LINKS = [
  { label: 'Deals', href: '/deals' },
  { label: 'Sell', href: '/sell' },
  { label: 'Help', href: '/help' },
];

/**
 * AnimatedSiteHeader — scroll-aware navbar with 3D depth, magnetic items,
 * animated logo, pulsing cart badge, and smooth reveal/hide on scroll.
 */
export function SiteHeader() {
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Scroll-aware: shrink header on scroll
  const { scrollY } = useScroll();
  const headerScale = useTransform(scrollY, [0, 60], [1, 0.97]);
  const headerOpacity = useTransform(scrollY, [0, 80], [1, 0.85]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { authed, ready, roles } = useAuthenticated();

  // Autocomplete with a short debounce.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      void searchApi
        .suggestions(trimmed)
        .then((rows) => setSuggestions(rows))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onClick(event: MouseEvent): void {
      if (!searchRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submitSearch(): void {
    const trimmed = query.trim();
    setOpen(false);
    if (trimmed) window.location.assign(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      {/* Main navbar */}
      <motion.header
        style={{
          scale: headerScale,
          opacity: headerOpacity,
          boxShadow: scrolled
            ? '0 4px 30px -4px var(--shadow-color), 0 0 0 1px color-mix(in oklch, var(--primary) 8%, transparent)'
            : '0 1px 0 0 color-mix(in oklch, var(--primary) 10%, transparent)',
        }}
        className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl"
      >
        {/* Subtle gradient line at top */}
        <div className="absolute inset-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="page-container flex h-16 items-center gap-4">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="inline-flex items-center lg:hidden"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            <span className="sr-only">Menu</span>
            <motion.span
              className="flex h-6 w-6 flex-col items-center justify-center gap-1"
              animate={navOpen ? { gap: 4 } : { gap: 5 }}
            >
              <motion.span
                className="h-0.5 w-5 rounded bg-current"
                animate={navOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="h-0.5 w-5 rounded bg-current"
                animate={navOpen ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="h-0.5 w-5 rounded bg-current"
                animate={navOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
            </motion.span>
          </button>

          {/* Animated logo */}
          <Link href="/" className="shrink-0" aria-label="NOVA Commerce home">
            <motion.span
              className="text-xl font-bold tracking-tight"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="relative">
                NOVA
                <motion.span
                  className="absolute -bottom-0.5 left-0 h-px bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
              <span className="text-primary">.</span>
            </motion.span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <AnimatedMegaMenu />
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
              >
                <Link
                  href={link.href}
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  {link.label}
                  {/* Hover glow */}
                  <span className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 transition-opacity hover:opacity-100" />
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Search with animated expand */}
          <form
            className="flex flex-1 items-center justify-end gap-2"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <div ref={searchRef} className="relative w-full max-w-md">
              <motion.div
                className="absolute left-3 top-1/2 -translate-y-1/2"
                animate={open ? { rotate: 90, scale: 1.1 } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </motion.div>
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search products, brands, categories…"
                className="h-9 rounded-full bg-background/70 pl-9 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                aria-label="Search products"
                aria-expanded={open}
              />
              <AnimatePresence>
                {open && suggestions.length > 0 && (
                  <motion.div
                    className="absolute z-50 mt-2 w-full [perspective:900px]"
                    initial={{ opacity: 0, y: 8, rotateX: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, rotateX: -6, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ transformOrigin: 'top center' }}
                  >
                    <SpatialPanel depth={3} glass spotlight className="overflow-hidden p-2">
                      <ul role="listbox" aria-label="Search suggestions" className="space-y-0.5">
                        {suggestions.slice(0, 6).map((item, i) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Search className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{item.name}</span>
                                <span className="block text-xs text-muted-foreground">{item.category}</span>
                              </span>
                              <span className="shrink-0 text-xs font-medium">{formatCurrency(item.effectivePrice)}</span>
                            </Link>
                          </motion.li>
                        ))}
                        <li className="border-t pt-1">
                          <button
                            type="button"
                            onClick={submitSearch}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Search className="h-4 w-4" />
                            See all results for {query.trim()}
                          </button>
                        </li>
                      </ul>
                    </SpatialPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Button variant="ghost" size="icon" asChild aria-label="Wishlist">
              <Link href="/wishlist">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: -8 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <Heart className="h-5 w-5 text-foreground/70" />
                </motion.div>
              </Link>
            </Button>

            <AnimatedCartButton />

            {!authed && ready && (
              <Link href="/login">
                <Button variant="default" size="sm" className="h-8 rounded-full px-4 text-sm font-medium">
                  Sign in
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" asChild aria-label="Settings">
              <Link href="/control-center/settings">
                <Settings className="h-5 w-5 text-foreground/70" />
              </Link>
            </Button>

            {roles.includes('ADMIN') && (
              <Link href="/admin">
                <Button variant="default" size="sm" className="h-8 rounded-full px-4 text-sm font-medium">
                  Admin
                </Button>
              </Link>
            )}
            {roles.includes('SELLER') && !roles.includes('ADMIN') && (
              <Link href="/dashboard">
                <Button variant="default" size="sm" className="h-8 rounded-full px-4 text-sm font-medium">
                  Seller
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      <MobileNav open={navOpen} onOpenChange={setNavOpen} />
    </>
  );
}
