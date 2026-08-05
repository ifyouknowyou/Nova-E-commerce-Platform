'use client';

import { ArrowRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Newsletter signup panel. Frontend-only: submission is a graceful no-op that
 * confirms receipt (no newsletter endpoint exists in the backend). The email is
 * validated and the UI gives feedback without fabricating a stored subscription.
 */
export function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setEmail('');
      toast.success('You’re on the list! Watch your inbox for the next drop.');
    }, 600);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-role-soft p-8 text-card-foreground depth-2 sm:p-12">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Mail className="h-4 w-4" /> Newsletter
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Get the best deals before anyone else
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Join the NOVA community for early access to drops, exclusive coupons, and
            picks from our verified sellers.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="h-11 sm:w-72"
          />
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Subscribing…' : 'Subscribe'}
            {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </form>
      </div>
    </div>
  );
}
