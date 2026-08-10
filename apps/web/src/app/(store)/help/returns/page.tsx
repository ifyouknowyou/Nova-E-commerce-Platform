import {
  ArrowLeft,
  Mail,
  Package,
  RefreshCcw,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { DepthCard } from '@/components/3d/depth-card';
import { CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Returns & refunds — NOVA Commerce',
  description: 'How returns work on NOVA: the return window, how to request one, and how refunds are processed.',
};

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Package,
    title: 'Find the item',
    body: 'Sign in and open the order containing the item you want to return.',
  },
  {
    icon: RefreshCcw,
    title: 'Request a return',
    body: 'Choose the reason and add details. Most items can be returned within 14 days of delivery.',
  },
  {
    icon: ShieldCheck,
    title: 'We review it',
    body: 'Your request is reviewed against the return policy. You’ll get a clear approval or rejection.',
  },
  {
    icon: Wallet,
    title: 'Get refunded',
    body: 'Approved returns are refunded to your original payment method within 3–5 business days.',
  },
];

export default function ReturnsHelpPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Returns &amp; refunds</h1>
        <p className="mt-2 text-muted-foreground">
          How returns work on NOVA, what you can return, and how refunds are processed.
        </p>
      </div>

      {/* How it works */}
      <DepthCard level={1} className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">How a return works</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  {i < STEPS.length - 1 ? <div className="mt-1 w-px flex-1 bg-border" /> : null}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="font-medium">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </DepthCard>

      {/* Policy details */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <DepthCard level={1}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Return window</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Request within <span className="font-medium text-foreground">14 days of delivery</span> for most items.</li>
              <li>Items must be in <span className="font-medium text-foreground">original condition</span> with tags and packaging.</li>
              <li>Some sellers set their own, more generous windows — check the order for details.</li>
            </ul>
          </CardContent>
        </DepthCard>

        <DepthCard level={1}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Refunds</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Refunds are issued to your <span className="font-medium text-foreground">original payment method</span>.</li>
              <li>Processing takes <span className="font-medium text-foreground">3–5 business days</span> once your return is approved.</li>
              <li>Shipping costs are refunded only for eligible, seller-error returns.</li>
            </ul>
          </CardContent>
        </DepthCard>

        <DepthCard level={1} className="sm:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">What can’t be returned</h2>
            </div>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• Items damaged or worn after delivery</li>
              <li>• Personalized or made-to-order goods</li>
              <li>• Downloadable or digital products</li>
              <li>• Opened consumables, unless faulty</li>
            </ul>
          </CardContent>
        </DepthCard>
      </div>

      {/* Status explanations */}
      <DepthCard level={1} className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">Return statuses</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-medium text-foreground">Requested</span> — your return has been submitted and is awaiting review.</p>
            <p><span className="font-medium text-foreground">Approved</span> — the return is accepted and your refund is being processed.</p>
            <p><span className="font-medium text-foreground">Rejected</span> — the item did not qualify; check the note from the reviewer.</p>
            <p><span className="font-medium text-foreground">Refunded</span> — the money is back on your original payment method.</p>
          </div>
        </CardContent>
      </DepthCard>

      {/* Support */}
      <DepthCard level={1} className="mt-8">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Still need help?</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Our support team responds within 24 hours. Email us at support@nova.test with your order number.
          </p>
        </CardContent>
      </DepthCard>
    </div>
  );
}
