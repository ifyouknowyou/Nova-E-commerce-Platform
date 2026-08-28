import type { Metadata } from 'next';
import { FileText, Shield, Scale, UserCheck } from 'lucide-react';
import { DepthCard } from '@/components/3d/depth-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of the NOVA Commerce marketplace.',
};

const SECTIONS: {
  title: string;
  icon: typeof FileText;
  body: string[];
}[] = [
  {
    title: '1. Acceptance of terms',
    icon: Scale,
    body: [
      'By accessing or using NOVA Commerce ("NOVA"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the marketplace.',
    ],
  },
  {
    title: '2. Your account',
    icon: UserCheck,
    body: [
      'You are responsible for safeguarding your account credentials and for all activity that occurs under your account.',
      'You must provide accurate, current information and update it when it changes.',
      'You must be at least 16 years old to use the marketplace, or the age of majority in your jurisdiction.',
    ],
  },
  {
    title: '3. Orders & payments',
    icon: FileText,
    body: [
      'When you place an order, you agree to pay the price shown at checkout, plus any applicable taxes and shipping.',
      'We may cancel or decline an order if we suspect fraud, a pricing error, or a violation of these terms.',
      'Prices are in US dollars unless otherwise stated and may change at any time, but changes will not apply to orders you have already placed.',
    ],
  },
  {
    title: '4. Returns & refunds',
    icon: Shield,
    body: [
      'Eligible items may be returned within 30 days of delivery, subject to our Returns policy.',
      'Refunds are issued to the original payment method once the returned item is received and inspected.',
      'Digital and personalized items may not be eligible for return unless defective.',
    ],
  },
  {
    title: '5. Acceptable use',
    icon: Scale,
    body: [
      'You agree not to use the marketplace for any unlawful purpose or in any way that could damage, disable, or impair the service.',
      'You may not attempt to gain unauthorized access to any part of the platform, other accounts, or systems.',
      'You may not scrape, resell, or commercially exploit any content from the marketplace without our written consent.',
    ],
  },
  {
    title: '6. Seller terms',
    icon: FileText,
    body: [
      'Sellers are independent businesses and are solely responsible for the products they list, their accuracy, and their fulfillment.',
      'Sellers agree to fulfill orders promptly, ship to the address provided, and handle customer service for their products.',
      'NOVA may remove listings or suspend accounts that violate our policies or these terms.',
    ],
  },
  {
    title: '7. Intellectual property',
    icon: Shield,
    body: [
      'The NOVA name, logo, and site design are owned by NOVA Commerce and may not be used without permission.',
      'All content on the marketplace is protected by copyright and other laws. Product names and images belong to their respective owners.',
    ],
  },
  {
    title: '8. Disclaimers & liability',
    icon: Scale,
    body: [
      'The marketplace is provided "as is" and "as available" without warranties of any kind, whether express or implied.',
      'To the maximum extent permitted by law, NOVA shall not be liable for indirect, incidental, or consequential damages arising from your use of the marketplace.',
      'Nothing in these terms limits liability that cannot be limited under applicable law.',
    ],
  },
  {
    title: '9. Changes to these terms',
    icon: FileText,
    body: [
      'We may update these terms from time to time. Material changes will be posted on this page and, where appropriate, notified to you by email.',
      'Continued use of the marketplace after changes take effect constitutes acceptance of the revised terms.',
    ],
  },
  {
    title: '10. Contact',
    icon: Shield,
    body: [
      'Questions about these terms? Email legal@nova.shop or write to NOVA Commerce, Legal Team, 1 Marketplace Way, San Francisco, CA.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Terms of Service"
          subtitle="The terms that govern your use of the NOVA Commerce marketplace"
        />
      </Reveal3D>

      <Reveal3D delay={0.1}>
        <DepthCard level={2} className="mt-6 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Welcome to NOVA Commerce. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
            the NOVA marketplace, operated by NOVA Commerce. Please read them carefully — by using our
            platform you agree to them.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Effective date: August 3, 2026
          </p>
        </DepthCard>
      </Reveal3D>

      <div className="mt-8 space-y-4">
        {SECTIONS.map((section, index) => (
          <Reveal3D key={section.title} delay={0.05 * index}>
            <DepthCard level={2} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold tracking-tight">{section.title}</h2>
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
