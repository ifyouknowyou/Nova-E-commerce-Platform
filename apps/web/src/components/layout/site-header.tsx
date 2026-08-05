'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  History,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserCircle,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AccountBar, type AccountNavItem } from '@/components/3d/account-bar';
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

const ROLE_MENUS: Record<string, AccountNavItem[]> = {
  CUSTOMER: [
    { label: 'Profile', href: '/account/profile', icon: UserCircle },
    { label: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Addresses', href: '/account/profile?tab=addresses', icon: MapPin },
    { label: 'Security', href: '/account/profile?tab=security', icon: ShieldCheck },
  ],
  SELLER: [
    { label: 'Profile', href: '/account/profile', icon: UserCircle },
    { label: 'Seller Center', href: '/dashboard', icon: Store },
    { label: 'Products', href: '/dashboard/products', icon: Package },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Store Settings', href: '/dashboard/store', icon: Settings },
    { label: 'Security', href: '/account/profile?tab=security', icon: ShieldCheck },
  ],
  ADMIN: [
    { label: 'Profile', href: '/account/profile', icon: UserCircle },
    { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Sellers', href: '/admin/sellers', icon: Store },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Permissions', href: '/account/profile?tab=permissions', icon: KeyRound },
    { label: 'Audit Logs', href: '/account/profile?tab=activity', icon: History },
  ],
};

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

  // Build the account nav for the header dropdown.
  const accountNav =
    roles.includes('ADMIN')
      ? ROLE_MENUS.ADMIN
      : roles.includes('SELLER')
        ? [...ROLE_MENUS.SELLER, ...ROLE_MENUS.CUSTOMER]
        : ROLE_MENUS.CUSTOMER ?? [];

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
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground depth-2">
                <ul role="listbox" aria-label="Search suggestions">
                  {suggestions.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.name}</span>
                          <span className="block text-xs text-muted-foreground">{item.category}</span>
                        </span>
                        <span className="shrink-0 text-xs font-medium">{formatCurrency(item.effectivePrice)}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="border-t">
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                    >
                      <Search className="h-4 w-4" />
                      See all results for “{query.trim()}”
                    </button>
                  </li>
                </ul>
              </div>
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
                      nav={accountNav}
                      footer={
                        <DropdownMenuItem onSelect={() => void handleLogout()} className="mt-1 flex items-center gap-2 text-red-600">
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