import { BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Minimal shape of a Stripe webhook event we care about. */
export interface StripeEvent {
  id: string;
  type: string;
  data: { object: { id: string } };
}

/**
 * Verify a Stripe `stripe-signature` header against the webhook secret.
 * Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 — we reproduce that
 * here so no external SDK is required at runtime.
 */
export function verifyStripeSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): StripeEvent {
  if (!signature) throw new BadRequestException('Missing Stripe signature');

  const parts = signature.split(',').reduce<{ timestamp?: string; signature?: string }>((acc, part) => {
    const [key, value] = part.split('=');
    if (key === 't') acc.timestamp = value;
    if (key === 'v1') acc.signature = value;
    return acc;
  }, {});

  if (!parts.timestamp || !parts.signature) {
    throw new BadRequestException('Malformed Stripe signature');
  }

  const signedPayload = `${parts.timestamp}.${rawBody.toString('utf8')}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest();
  const provided = Buffer.from(parts.signature, 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new BadRequestException('Invalid Stripe signature');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - Number(parts.timestamp)) > 300) {
    throw new BadRequestException('Stripe signature timestamp too old');
  }

  const event = JSON.parse(rawBody.toString('utf8')) as StripeEvent;
  if (!event.id || !event.type || !event.data?.object?.id) {
    throw new BadRequestException('Malformed Stripe event');
  }
  return event;
}
