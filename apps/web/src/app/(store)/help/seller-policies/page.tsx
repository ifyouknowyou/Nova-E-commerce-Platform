import {
  ArrowLeft,
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
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/help"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to help center
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight">Seller policies &amp; fees</h1>
        <p className="mt-2 text-muted-foreground">
          How selling on NOVA works — fees, listing rules, and the standards we hold every store to.
        </p>
      </div>

      {/* Fees */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Fees</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold tracking-tight text-primary">5%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Flat commission per sale. Deducted when an order is completed.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold tracking-tight text-primary">$0</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Monthly subscription and setup fee. No cost to create or run your store.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-2xl font-bold tracking-tight text-primary">No</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hidden fees. What you see in the dashboard is what you keep.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Your store’s commission rate is shown in the seller dashboard. Fees may be adjusted per
            store for enterprise or promotional programs.
          </p>
        </CardContent>
      </Card>

      {/* Policy sections */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Questions about selling?</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Start your store in minutes or reach our seller support team at sellers@nova.test.
          </p>
          <Link href="/sell" className="text-sm font-medium text-primary hover:underline">
            Become a seller →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
