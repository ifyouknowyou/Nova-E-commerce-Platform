import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Mail,
  PackageCheck,
  Percent,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { DepthCard } from '@/components/3d/depth-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Seller policies & fees — NOVA Commerce',
  description:
    'Fees, listing rules, order standards, and account policies for sellers on the NOVA marketplace.',
};

interface PolicySection {
  icon: LucideIcon;
  title: string;
  items: string[];
}

const SECTIONS: PolicySection[] = [
  {
    icon: Store,
    title: 'Listing & approval',
    items: [
      'New products are reviewed and go live only after approval.',
      'Listings must be accurate: real photos, honest descriptions, and correct prices and stock.',
      'Prohibited items — counterfeits, unsafe or restricted goods — are removed and can lead to suspension.',
      'Keep your catalog, pricing, and inventory current at all times.',
    ],
  },
  {
    icon: PackageCheck,
    title: 'Order fulfillment',
    items: [
      'Fulfill orders promptly and ship within the timeframe shown to buyers.',
      'Keep stock levels accurate so customers see real availability.',
      'Respond to customer messages and honor the marketplace return policy for your items.',
      'Cancellations and returns follow the status flow shown in your dashboard.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Account & store standards',
    items: [
      'One store per seller account; keep your business contact details up to date.',
      'Selling privileges may be suspended for policy violations or unresolved disputes.',
      'Suspended stores cannot take new orders until the issue is resolved.',
      'Platform administrators may moderate listings and review seller activity.',
    ],
  },
  {
    icon: Wallet,
    title: 'Payouts',
    items: [
      'Sale proceeds settle to your account after the order is completed.',
      'Revenue, units sold, and average order value are visible in your analytics.',
      'Commissions are deducted from each sale — there are no hidden or monthly fees.',
    ],
  },
];

export default function SellerPoliciesPage() {
  return (
    <div className="page-container py-8">
      <Reveal3D>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to help center
          </Link>
        </div>
        <PageHeader
          title="Seller policies &amp; fees"
          subtitle="How selling on NOVA works — fees, listing rules, and the standards we hold every store to"
        />
      </Reveal3D>

      {/* Fees */}
      <Reveal3D delay={0.1}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <Percent className="h-4 w-4 text-warning" />
              </div>
              <h2 className="text-base font-bold tracking-tight">Fees</h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
                <p className="text-3xl font-bold tracking-tight text-primary">5%</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Flat commission per sale. Deducted when an order is completed.
                </p>
              </div>
              <div className="rounded-xl border border-success/10 bg-success/5 p-4 text-center">
                <p className="text-3xl font-bold tracking-tight text-success">$0</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Monthly subscription and setup fee. No cost to create or run your store.
                </p>
              </div>
              <div className="rounded-xl border border-muted p-4 text-center">
                <p className="text-3xl font-bold tracking-tight">No</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Hidden fees. What you see in the dashboard is what you keep.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your store’s commission rate is shown in the seller dashboard. Fees may be adjusted per
              store for enterprise or promotional programs.
            </p>
          </CardContent>
        </DepthCard>
      </Reveal3D>

      {/* Policy sections */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, index) => (
          <Reveal3D key={section.title} delay={0.05 * index}>
            <DepthCard level={2} glow className="h-full overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight">{section.title}</h2>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </DepthCard>
          </Reveal3D>
        ))}
      </div>

      {/* CTA */}
      <Reveal3D delay={0.3}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden bg-role-soft">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </span>
            <h2 className="text-lg font-bold tracking-tight">Questions about selling?</h2>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Start your store in minutes or reach our seller support team at sellers@nova.test.
            </p>
            <Link href="/sell" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Become a seller
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </DepthCard>
      </Reveal3D>
    </div>
  );
}
