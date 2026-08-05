import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Coins, Compass, GraduationCap, HeartPulse, Laptop } from 'lucide-react';
import { DepthCard } from '@/components/3d/depth-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the team building NOVA Commerce — a marketplace that empowers independent sellers around the world.',
};

const BENEFITS = [
  { icon: HeartPulse, title: 'Health & wellbeing', body: 'Comprehensive health coverage, mental-health support, and generous time off.' },
  { icon: Laptop, title: 'Work from anywhere', body: 'Remote-first team with a home-office budget and yearly team gatherings.' },
  { icon: GraduationCap, title: 'Learning budget', body: 'Annual budget for courses, books, and conferences that help you grow.' },
  { icon: Coins, title: 'Equity & salary', body: 'Competitive pay with equity so everyone shares in the company’s success.' },
  { icon: Compass, title: 'Real impact', body: 'Small teams, direct line to customers, and ownership over meaningful work.' },
];

const ROLES = [
  {
    team: 'Engineering',
    title: 'Senior Full-Stack Engineer',
    type: 'Full-time · Remote',
    body: 'Own features end to end across our Next.js storefront and NestJS API — from schema design to shipped UI.',
  },
  {
    team: 'Engineering',
    title: 'Platform Engineer',
    type: 'Full-time · Remote',
    body: 'Keep our marketplace fast and reliable: payments, caching, search, and the infrastructure behind every order.',
  },
  {
    team: 'Product',
    title: 'Product Manager, Seller Tools',
    type: 'Full-time · Remote',
    body: 'Work directly with sellers to design the tools they use to grow their stores on NOVA.',
  },
  {
    team: 'Design',
    title: 'Product Designer',
    type: 'Full-time · Remote',
    body: 'Shape a storefront and seller dashboard that feel premium for thousands of independent businesses.',
  },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-role-glow px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <Briefcase className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Build the marketplace you’d want to shop on
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We’re a small, remote-first team on a mission to give independent sellers a premium home
          on the internet. If that sounds like work you want to do, we want to hear from you.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="#open-roles">See open roles</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/about">About NOVA</Link>
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-16">
        <SectionHeading kicker="Perks" title="Why join NOVA" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <DepthCard key={benefit.title} level={1} className="p-6 transition-all hover:-translate-y-1 hover:depth-2">
              <benefit.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
            </DepthCard>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section id="open-roles" className="mt-16">
        <SectionHeading title="Open roles" />
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Don’t see your role? We’re always interested in exceptional people. Email us at
          {' '}<span className="font-medium text-foreground">jobs@nova.shop</span> and tell us what you’d build.
        </p>
        <div className="mt-6 space-y-4">
          {ROLES.map((role) => (
            <DepthCard key={role.title} level={1} className="flex flex-col gap-4 p-6 transition-all hover:depth-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{role.team}</p>
                <h3 className="mt-1 text-lg font-semibold">{role.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{role.type}</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{role.body}</p>
              </div>
              <Button asChild variant="outline" className="shrink-0 rounded-full">
                <a href={`mailto:jobs@nova.shop?subject=${encodeURIComponent(`Application: ${role.title}`)}`}>
                  Apply now
                </a>
              </Button>
            </DepthCard>
          ))}
        </div>
      </section>
    </div>
  );
}
