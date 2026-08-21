import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How NOVA Commerce collects, uses, and protects your personal information.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Information we collect',
    body: [
      'Account information: your name, email address, and password (stored as an encrypted hash) when you create an account.',
      'Order information: the items you buy, shipping address, and payment details needed to complete your purchase. Full payment card numbers are processed by our payment partners and are never stored on our servers.',
      'Usage information: pages you visit, searches you make, and how you interact with the marketplace, collected to improve our service.',
      'Device information: browser type, IP address, and operating system, used for security and fraud prevention.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'To provide and maintain the marketplace: process orders, manage your account, and deliver support.',
      'To communicate with you: send order updates, verification emails, and — only with your consent — marketing that you can opt out of at any time.',
      'To keep the platform safe: detect fraud, abuse, and unauthorized access.',
      'To improve our service: analyze usage patterns to make search, recommendations, and checkout better.',
    ],
  },
  {
    title: 'Information we share',
    body: [
      'Sellers: when you place an order, we share the delivery details needed for the seller to fulfill it.',
      'Service providers: we work with trusted partners for payments, shipping, email, and analytics. They may only use your data to provide those services.',
      'Legal requirements: we disclose information when required by law, or when needed to protect the rights and safety of our users and the platform.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can access, update, or delete your account information at any time from your account settings.',
      'You can unsubscribe from marketing emails with the link in every message.',
      'You can request a copy of the personal data we hold about you, or ask us to delete it, by contacting privacy@nova.shop.',
    ],
  },
  {
    title: 'Data retention & security',
    body: [
      'We keep your personal data only as long as needed for the purposes described here or as required by law.',
      'We use encryption in transit and at rest, role-based access controls, and regular security reviews to protect your data.',
      'In the event of a data breach affecting your information, we will notify you in accordance with applicable law.',
    ],
  },
  {
    title: 'Cookies',
    body: [
      'We use essential cookies to keep you signed in and to maintain your shopping cart and session.',
      'We may use analytics cookies to understand how the marketplace is used, so we can improve it.',
      'You can disable cookies in your browser, though some features may not work without them.',
    ],
  },
  {
    title: 'Contact us',
    body: [
      'Questions about this policy or our privacy practices? Email privacy@nova.shop or write to NOVA Commerce, Privacy Team, 1 Marketplace Way, San Francisco, CA.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective date: August 3, 2026</p>
      <p className="mt-6 leading-relaxed text-muted-foreground">
        This Privacy Policy explains how NOVA Commerce (“NOVA”, “we”, “us”) collects, uses, and
        protects your personal information when you use our marketplace. By using NOVA, you agree to
        the practices described in this policy.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
