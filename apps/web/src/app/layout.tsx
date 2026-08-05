import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-[var(--font-inter)] antialiased">
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
