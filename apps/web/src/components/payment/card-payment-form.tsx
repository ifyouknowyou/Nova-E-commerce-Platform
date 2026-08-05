'use client';

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/payments';
import { formatCurrency } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

export function CardPaymentForm({
  orderId,
  total,
  postalCode,
  onPaid,
}: {
  orderId: string;
  total: number;
  postalCode: string;
  onPaid: () => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <PayBody orderId={orderId} total={total} postalCode={postalCode} onPaid={onPaid} />
    </Elements>
  );
}

function PayBody({
  orderId,
  total,
  postalCode,
  onPaid,
}: {
  orderId: string;
  total: number;
  postalCode: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handlePay(): Promise<void> {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    try {
      const { clientSecret } = await paymentsApi.start(orderId);
      if (!clientSecret) {
        toast.error('Unable to start payment');
        return;
      }
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { address: { postal_code: postalCode } },
        },
      });
      if (result.error) {
        toast.error(result.error.message ?? 'Payment failed');
        return;
      }
      await paymentsApi.confirm(orderId);
      onPaid();
      toast.success('Payment successful');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Secure card payment
      </div>

      {/* EMAIL */}

      <div className="rounded-md border p-3">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '15px',
                color: 'hsl(var(--foreground))',
                '::placeholder': { color: 'hsl(var(--muted-foreground))' },
              },
            },
          }}
        />
      </div>

      <Button className="w-full" size="lg" disabled={!stripe || processing} onClick={() => void handlePay()}>
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {processing ? 'Processing…' : `Pay ${formatCurrency(total)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        This is a test environment. Use Stripe test card 4242 4242 4242 4242.
      </p>
    </div>
  );
}