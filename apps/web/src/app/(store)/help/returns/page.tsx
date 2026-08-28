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
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
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
          title="Returns &amp; refunds"
          subtitle="How returns work on NOVA, what you can return, and how refunds are processed"
        />
      </Reveal3D>

      {/* How it works */}
      <Reveal3D delay={0.1}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <RefreshCcw className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-bold tracking-tight">How a return works</h2>
            </div>
            <ol className="mt-5 space-y-0">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <step.icon className="h-4 w-4" />
                    </div>
                    {i < STEPS.length - 1 ? <div className="mt-1 w-px flex-1 bg-border" /> : null}
                  </div>
                  <div className="pb-5 min-w-0">
                    <p className="font-semibold text-sm">
                      <span className="mr-1.5 text-primary/60">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </DepthCard>
      </Reveal3D>

      {/* Policy details */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Reveal3D delay={0.15}>
          <DepthCard level={2} glow className="h-full overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <RefreshCcw className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold tracking-tight">Return window</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>Request within <span className="font-semibold text-foreground">14 days of delivery</span> for most items.</li>
                <li>Items must be in <span className="font-semibold text-foreground">original condition</span> with tags and packaging.</li>
                <li>Some sellers set their own, more generous windows — check the order for details.</li>
              </ul>
            </CardContent>
          </DepthCard>
        </Reveal3D>

        <Reveal3D delay={0.2}>
          <DepthCard level={2} glow className="h-full overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold tracking-tight">Refunds</h2>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>Refunds are issued to your <span className="font-semibold text-foreground">original payment method</span>.</li>
                <li>Processing takes <span className="font-semibold text-foreground">3–5 business days</span> once your return is approved.</li>
                <li>Shipping costs are refunded only for eligible, seller-error returns.</li>
              </ul>
            </CardContent>
          </DepthCard>
        </Reveal3D>

        <Reveal3D delay={0.25}>
          <DepthCard level={2} glow className="sm:col-span-2 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold tracking-tight">What can’t be returned</h2>
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  Items damaged or worn after delivery
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  Personalized or made-to-order goods
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  Downloadable or digital products
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  Opened consumables, unless faulty
                </li>
              </ul>
            </CardContent>
          </DepthCard>
        </Reveal3D>
      </div>

      {/* Status explanations */}
      <Reveal3D delay={0.3}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-bold tracking-tight">Return statuses</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-3">
                <span className="font-semibold text-foreground">Requested</span>
                <span className="text-muted-foreground"> — your return has been submitted and is awaiting review.</span>
              </div>
              <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                <span className="font-semibold text-success">Approved</span>
                <span className="text-muted-foreground"> — the return is accepted and your refund is being processed.</span>
              </div>
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                <span className="font-semibold text-danger">Rejected</span>
                <span className="text-muted-foreground"> — the item did not qualify; check the note from the reviewer.</span>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <span className="font-semibold text-primary">Refunded</span>
                <span className="text-muted-foreground"> — the money is back on your original payment method.</span>
              </div>
            </div>
          </CardContent>
        </DepthCard>
      </Reveal3D>

      {/* Support */}
      <Reveal3D delay={0.35}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden bg-role-soft">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </span>
            <h2 className="text-lg font-bold tracking-tight">Still need help?</h2>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Our support team responds within 24 hours. Email us at support@nova.test with your order number.
            </p>
          </CardContent>
        </DepthCard>
      </Reveal3D>
    </div>
  );
}
