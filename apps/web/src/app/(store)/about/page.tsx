import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Globe, HeartHandshake, Package, Shield, Sparkles } from 'lucide-react';
import { DepthCard } from '@/components/3d/depth-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about NOVA Commerce — the multi-vendor marketplace connecting independent sellers with customers worldwide.',
};

const VALUES = [
  {
    icon: Package,
    title: 'Independent sellers, amplified',
    body: 'We give independent stores the tools to reach customers they could never reach alone — storefronts, payments, shipping, and analytics in one place.',
  },
  {
    icon: Shield,
    title: 'Trusted transactions',
    body: 'Buyer protection, secure payments, and verified sellers mean every order is covered from checkout to delivery.',
  },
  {
    icon: HeartHandshake,
    title: 'Fair to everyone',
    body: 'Clear fees, transparent policies, and a marketplace built so both customers and sellers win on every order.',
  },
  {
    icon: Sparkles,
    title: 'Better every day',
    body: 'We ship improvements weekly — better search, faster checkout, smarter recommendations, and tools sellers ask for.',
  },
];

const STATS = [
  { value: '1,200+', label: 'Active sellers' },
  { value: '250K+', label: 'Orders fulfilled' },
  { value: '40+', label: 'Countries served' },
  { value: '99.9%', label: 'Uptime' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-role-glow px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <BadgeCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          A marketplace built for the people who make and buy great things
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          NOVA Commerce is a multi-vendor marketplace. We started with a simple idea: the best
          products are often made by small, independent teams — and they deserve a storefront that
          feels as premium as they are.
        </p>
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

      {/* Story */}
      <section className="mx-auto mt-16 max-w-3xl space-y-6">
        <SectionHeading kicker="Our story" title="Why we built NOVA" />
        <p className="leading-relaxed text-muted-foreground">
          NOVA began when a handful of small-store owners told us the same thing: the platforms they
          were selling on took a big cut, dictated the rules, and made them feel invisible. We set
          out to build the marketplace we wished existed — one where sellers own their brand,
          customers find products they actually love, and the platform simply gets out of the way.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Today we power thousands of independent sellers across dozens of countries. We are still
          small enough to care about every store that joins, and we intend to stay that way.
        </p>
      </section>

      {/* Values */}
      <section className="mt-16">
        <SectionHeading title="What we stand for" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {VALUES.map((value) => (
            <DepthCard key={value.title} level={1} className="p-6 transition-all hover:-translate-y-1 hover:depth-2">
              <value.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{value.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </DepthCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-3xl rounded-2xl border bg-role-soft p-8 text-center sm:p-12 depth-1">
        <Globe className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">Shop the marketplace</h2>
        <p className="mt-2 text-muted-foreground">
          Every product you buy supports an independent business. Start exploring what they have to offer.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/products">Browse products</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/careers">Work with us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
