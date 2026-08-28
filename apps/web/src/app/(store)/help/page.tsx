import {
  ArrowRight,
  Mail,
  MessageSquare,
  Package,
  RefreshCcw,
  Truck,
} from 'lucide-react';
import type { HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { DepthCard } from '@/components/3d/depth-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Help center',
  description: 'Answers to common questions about ordering, shipping, returns, and payments on NOVA Commerce.',
};

interface HelpSection {
  icon: typeof HelpCircle;
  title: string;
  link?: { href: string; label: string };
  qa: { q: string; a: string }[];
}

const FAQS: HelpSection[] = [
  {
    icon: Package,
    title: 'Orders',
    qa: [
      { q: 'How do I track my order?', a: 'Sign in, open "My orders", and select the order to see its live status timeline from confirmation through delivery.' },
      { q: 'Can I cancel an order?', a: 'Yes — orders in Pending or Confirmed status can be cancelled from the order detail page. Once shipped, use the return flow instead.' },
      { q: 'When will I receive a confirmation email?', a: 'Immediately after you place an order. If it is not in your inbox, check spam or contact support.' },
    ],
  },
  {
    icon: Truck,
    title: 'Shipping',
    qa: [
      { q: 'What are the shipping options?', a: 'Standard delivery (3–7 business days) and Express (1–2 business days). Orders over $50 ship free.' },
      { q: 'Do you ship internationally?', a: 'Yes. Enter your country at checkout and eligible sellers will show available shipping methods.' },
    ],
  },
  {
    icon: RefreshCcw,
    title: 'Returns & refunds',
    link: { href: '/help/returns', label: 'Read the full returns policy' },
    qa: [
      { q: 'What is the return window?', a: 'You can request a return within 14 days of delivery for most items. The item must be in original condition.' },
      { q: 'How are refunds processed?', a: 'Once your return is approved, the refund is issued to your original payment method within 3–5 business days.' },
    ],
  },
  {
    icon: MessageSquare,
    title: 'Payments & account',
    qa: [
      { q: 'Which payment methods are accepted?', a: 'All major credit and debit cards via Stripe. PayPal support is planned.' },
      { q: 'Why is my email verification required?', a: 'Verifying your email keeps your account secure and prevents misuse. You can resend the link from the register page.' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Help Center"
          subtitle="Answers to common questions about ordering, shipping, returns, and payments"
        />
      </Reveal3D>

      <div className="mt-8 space-y-4">
        {FAQS.map((section, index) => (
          <Reveal3D key={section.title} delay={0.05 * index}>
            <DepthCard level={2} glow className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <section.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base font-bold tracking-tight">{section.title}</h2>
                  </div>
                  {section.link ? (
                    <Link
                      href={section.link.href}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {section.link.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
                <div className="mt-5 space-y-4">
                  {section.qa.map((item) => (
                    <div key={item.q} className="border-l-2 border-primary/20 pl-4">
                      <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </DepthCard>
          </Reveal3D>
        ))}
      </div>

      <Reveal3D delay={0.3}>
        <DepthCard level={2} glow className="mt-8 overflow-hidden bg-role-soft">
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
