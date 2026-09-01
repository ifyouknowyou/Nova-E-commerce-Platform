import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { JsonLd } from '@/components/seo/json-ld';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'NOVA Commerce',
    template: '%s · NOVA Commerce',
  },
  description:
    'NOVA Commerce — a premium multi-vendor marketplace. Shop trusted products, track orders, and grow your store.',
  keywords: ['e-commerce', 'marketplace', 'shop', 'NOVA Commerce'],
  openGraph: {
    type: 'website',
    siteName: 'NOVA Commerce',
    title: 'NOVA Commerce',
    description: 'A premium multi-vendor marketplace.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVA Commerce',
    description: 'A premium multi-vendor marketplace.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0c10' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NOVA Commerce',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    sameAs: [
      'https://twitter.com/novacommerce',
      'https://www.linkedin.com/company/nova-commerce',
    ],
  };

  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={organizationLd} />
      </head>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
