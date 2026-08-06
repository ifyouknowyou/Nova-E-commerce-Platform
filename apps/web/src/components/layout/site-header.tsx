'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, LogOut, Search, ShoppingCart, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AccountBar } from '@/components/3d/account-bar';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { ADMIN_NAV, SELLER_NAV, buildAccountNav, type NavLinkItem } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthenticated } from '@/hooks/use-auth';
import { authApi } from '@/lib/auth';
import { usersApi } from '@/lib/profile';
import { searchApi, type SearchSuggestion } from '@/lib/search';
import { formatCurrency } from '@/lib/utils';
import { MegaMenu } from './mega-menu';
import { MobileNav } from './mobile-nav';

const NAV_LINKS = [
  { label: 'Deals', href: '/deals' },
  { label: 'Sell', href: '/sell' },
  { label: 'Help', href: '/help' },
];

export function SiteHeader() {
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { authed, ready } = useAuthenticated();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me,
    enabled: ready && authed,
  });

  const roles = profile?.roles ?? [];

  async function handleLogout(): Promise<void> {
    setAccountOpen(false);
    try {
      await authApi.logout();
    } finally {
      window.location.assign('/');
    }
  }

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

  // Grouped dropdown nav: personal account links for everyone, plus the role
  // workspace section(s). No item belongs to two sections, so nothing repeats.
  // A section is skipped while its own sidebar is already on screen — e.g. on
  // /account the sidebar already lists the account links, so the dropdown does
  // not show the same URLs again.
  const isAdmin = roles.includes('ADMIN');
  const sections: { title: string; items: NavLinkItem[] }[] = [];
  if (!pathname.startsWith('/account')) sections.push({ title: 'Account', items: buildAccountNav(roles) });
  // Admins moderate the marketplace — they never sell — so a SELLER role held
  // alongside ADMIN does not surface the Seller workspace in the dropdown.
  if (!isAdmin && roles.includes('SELLER') && !pathname.startsWith('/dashboard')) sections.push({ title: 'Seller', items: SELLER_NAV });
  if (isAdmin && !pathname.startsWith('/admin')) sections.push({ title: 'Admin', items: ADMIN_NAV });

  const initials = (profile?.name ?? profile?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-transparent glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex items-center lg:hidden"
          aria-label="Open menu"
          onClick={() => setNavOpen(true)}
        >
          {/* Mobile hamburger */}
          <span className="sr-only">Menu</span>
          <span className="flex h-6 w-6 flex-col items-center justify-center gap-1">
            <span className="h-0.5 w-5 rounded bg-current" />
            <span className="h-0.5 w-5 rounded bg-current" />
            <span className="h-0.5 w-5 rounded bg-current" />
          </span>
        </button>

        <Link href="/" className="shrink-0" aria-label="NOVA Commerce home">
          <span className="text-xl font-bold tracking-tight">
            NOVA<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <MegaMenu />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form
          className="flex flex-1 items-center justify-end gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <div ref={searchRef} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search products, brands, categories…"
              className="h-9 rounded-full bg-background/70 pl-9"
              aria-label="Search products"
              aria-expanded={open}
            />
            {open && suggestions.length > 0 && (
              <motion.div
                className="absolute z-50 mt-2 w-full [perspective:900px]"
                initial={{ opacity: 0, y: 8, rotateX: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ transformOrigin: 'top center' }}
              >
                <SpatialPanel depth={3} glass spotlight className="overflow-hidden p-2">
                  <ul role="listbox" aria-label="Search suggestions" className="space-y-0.5">
                    {suggestions.slice(0, 6).map((item) => (
                      <li key={item.id}>
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
                      </li>
                    ))}
                    <li className="border-t pt-1">
                      <button
                        type="button"
                        onClick={submitSearch}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <Search className="h-4 w-4" />
                        See all results for “{query.trim()}”
                      </button>
                    </li>
                  </ul>
                </SpatialPanel>
              </motion.div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Button variant="ghost" size="icon" asChild aria-label="Wishlist">
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Cart">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account" className="relative">
                {authed && profile ? (
                  <Avatar className="h-8 w-8">
                    {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name ?? profile.email} /> : null}
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3">
              {authed ? (
                profile ? (
                  <>
                    <AccountBar
                      name={profile.name}
                      email={profile.email}
                      avatarUrl={profile.avatarUrl}
                      status={profile.status}
                      roles={roles}
                      sections={sections}
                      footer={
                        <DropdownMenuItem onSelect={() => void handleLogout()} className="mt-1 flex items-center gap-2 text-danger">
                          <LogOut className="h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      }
                    />
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuItem disabled>Loading your account…</DropdownMenuItem>
                  </>
                )
              ) : (
                <>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Create account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <MobileNav open={navOpen} onOpenChange={setNavOpen} />
    </header>
  );
}