import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CreditCard,
  Rocket,
  ShoppingBag,
  Store,
  Ticket,
} from 'lucide-react';
import { DepthCard } from '@/components/3d/depth-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { SellCta } from '@/components/sell-cta';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sell on NOVA',
  description:
    'Start and grow your online store on NOVA Commerce. Turn what you make into a thriving business.',
};

const FEATURES = [
  {
    icon: Store,
    title: 'Your own storefront',
    body: 'A professional store page with your brand, bio, and banner — ready in minutes, no design skills needed.',
  },
  {
    icon: Boxes,
    title: 'Powerful product & inventory tools',
    body: 'List products, manage stock, set variant quantities, and get notified the moment inventory runs low.',
  },
  {
    icon: ShoppingBag,
    title: 'Orders handled for you',
    body: 'Customers order, we process payment, and you ship. Track every order from the dashboard in real time.',
  },
  {
    icon: Ticket,
    title: 'Drive sales with coupons',
    body: 'Create discount codes and promotions to attract buyers and reward returning customers.',
  },
  {
    icon: BarChart3,
    title: 'Clear analytics',
    body: 'See revenue, units sold, and order trends so you always know how your store is performing.',
  },
  {
    icon: CreditCard,
    title: 'Fast, reliable payouts',
    body: 'Payments are processed securely and settled directly to you. No hidden fees — just a simple, fair rate.',
  },
];

const STEPS = [
  {
    title: 'Create your account',
    body: 'Sign up and verify your email. Your seller account is ready immediately.',
  },
  {
    title: 'Set up your store',
    body: 'Open the dashboard and add your store name, bio, and branding.',
  },
  {
    title: 'List your first products',
    body: 'Add products with prices, photos, and stock. They go live once approved.',
  },
  {
    title: 'Grow and get paid',
    body: 'Track orders and analytics, run promotions, and get paid as you sell.',
  },
];

const STATS = [
  { value: '5%', label: 'Simple flat fee per sale' },
  { value: '1,200+', label: 'Independent sellers' },
  { value: '0', label: 'Monthly subscription' },
  { value: '24h', label: 'Typical approval time' },
];

export default function SellPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-role-glow px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <Rocket className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Sell on NOVA. Turn what you do into a business
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Join thousands of independent sellers reaching customers around the world. Set up your store
          in minutes — no subscription, no upfront cost, pay only a simple per-sale rate.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/register">Create your store</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/dashboard">Open the dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <DepthCard key={stat.label} level={1} className="p-6 text-center">
            <p className="text-3xl font-bold tracking-tight text-primary">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </DepthCard>
        ))}
      </section>

      {/* Features */}
      <section className="mt-16">
        <SectionHeading kicker="Platform" title="Everything you need to sell" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <DepthCard key={feature.title} level={1} className="p-6 transition-all hover:-translate-y-1 hover:depth-2">
              <feature.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </DepthCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <SectionHeading title="How it works" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <DepthCard key={step.title} level={1} className="p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </DepthCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-3xl rounded-2xl border bg-role-soft p-8 text-center sm:p-12 depth-1">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">Ready to start selling?</h2>
        <p className="mt-2 text-muted-foreground">
          Create your account and list your first product in minutes. There&apos;s nothing to lose —
          only a simple per-sale rate when you sell.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <SellCta />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No subscription · No setup fee · Cancel anytime ·{' '}
          <Link href="/help/seller-policies" className="text-primary hover:underline">
            Fees &amp; policies
          </Link>
        </p>
      </section>
    </div>
  );
}