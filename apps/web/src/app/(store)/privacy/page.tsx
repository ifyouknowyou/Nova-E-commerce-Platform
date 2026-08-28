import type { Metadata } from 'next';
import { Lock, Eye, Globe, Shield } from 'lucide-react';
import { DepthCard } from '@/components/3d/depth-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SectionHeading } from '@/components/3d/section-heading';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How NOVA Commerce collects, uses, and protects your personal information.',
};

const SECTIONS: {
  title: string;
  icon: typeof Lock;
  body: string[];
}[] = [
  {
    title: 'Information we collect',
    icon: Lock,
    body: [
      'Account information: your name, email address, and password (stored as an encrypted hash) when you create an account.',
      'Order information: the items you buy, shipping address, and payment details needed to complete your purchase. Full payment card numbers are processed by our payment partners and are never stored on our servers.',
      'Usage information: pages you visit, searches you make, and how you interact with the marketplace, collected to improve our service.',
      'Device information: browser type, IP address, and operating system, used for security and fraud prevention.',
    ],
  },
  {
    title: 'How we use your information',
    icon: Eye,
    body: [
      'To provide and maintain the marketplace: process orders, manage your account, and deliver support.',
      'To communicate with you: send order updates, verification emails, and — only with your consent — marketing that you can opt out of at any time.',
      'To keep the platform safe: detect fraud, abuse, and unauthorized access.',
      'To improve our service: analyze usage patterns to make search, recommendations, and checkout better.',
    ],
  },
  {
    title: 'Information we share',
    icon: Globe,
    body: [
      'Sellers: when you place an order, we share the delivery details needed for the seller to fulfill it.',
      'Service providers: we work with trusted partners for payments, shipping, email, and analytics. They may only use your data to provide those services.',
      'Legal requirements: we disclose information when required by law, or when needed to protect the rights and safety of our users and the platform.',
    ],
  },
  {
    title: 'Your choices',
    icon: Shield,
    body: [
      'You can access, update, or delete your account information at any time from your account settings.',
      'You can unsubscribe from marketing emails with the link in every message.',
      'You can request a copy of the personal data we hold about you, or ask us to delete it, by contacting privacy@nova.shop.',
      'You can disable cookies in your browser, though some features may not work without them.',
    ],
  },
  {
    title: 'Data retention & security',
    icon: Lock,
    body: [
      'We keep your personal data only as long as needed for the purposes described here or as required by law.',
      'We use encryption in transit and at rest, role-based access controls, and regular security reviews to protect your data.',
      'In the event of a data breach affecting your information, we will notify you in accordance with applicable law.',
    ],
  },
  {
    title: 'Contact us',
    icon: Globe,
    body: [
      'Questions about this policy or our privacy practices? Email privacy@nova.shop or write to NOVA Commerce, Privacy Team, 1 Marketplace Way, San Francisco, CA.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Privacy Policy"
          subtitle="How we collect, use, and protect your personal information"
        />
      </Reveal3D>

      <Reveal3D delay={0.1}>
        <DepthCard level={2} className="mt-6 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This Privacy Policy explains how NOVA Commerce (&ldquo;NOVA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
            collects, uses, and protects your personal information when you use our marketplace.
            By using NOVA, you agree to the practices described in this policy.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Effective date: August 3, 2026
          </p>
        </DepthCard>
      </Reveal3D>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section, index) => (
          <Reveal3D key={section.title} delay={0.05 * index}>
            <DepthCard level={2} glow className="h-full">
              <div className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold tracking-tight">{section.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {section.body.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DepthCard>
          </Reveal3D>
        ))}
      </div>
    </div>
  );
}
