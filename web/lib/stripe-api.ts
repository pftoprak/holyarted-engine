import type { MembershipPlan } from './membership-store';
import { requireRuntimeValue, runtimeEnv } from './runtime-config';

type StripeError = { error?: { code?: string; message?: string } };

// Pinned so response shapes do not change with the account's default version.
// Webhook payloads still follow the endpoint's version, so readers below
// accept both the older and the newer field locations.
const STRIPE_VERSION = '2024-06-20';

export class StripeRequestError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, message: string) {
    super(message);
  }
}

async function stripeRequest<T>(method: 'GET' | 'POST' | 'DELETE', path: string, values?: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const secret = requireRuntimeValue('STRIPE_SECRET_KEY');
  const headers: Record<string, string> = {
    authorization: `Basic ${btoa(`${secret}:`)}`,
    'stripe-version': STRIPE_VERSION,
  };
  if (values) headers['content-type'] = 'application/x-www-form-urlencoded';
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, values ? { method, headers, body: values } : { method, headers });
  const payload = (await response.json()) as T & StripeError;
  if (!response.ok) {
    throw new StripeRequestError(response.status, payload.error?.code, payload.error?.message || 'Stripe request failed.');
  }
  return payload;
}

export function stripePost<T>(path: string, values: URLSearchParams, idempotencyKey?: string): Promise<T> {
  return stripeRequest<T>('POST', path, values, idempotencyKey);
}

export function stripeGet<T>(path: string): Promise<T> {
  return stripeRequest<T>('GET', path);
}

export function stripeDelete<T>(path: string): Promise<T> {
  return stripeRequest<T>('DELETE', path);
}

export function stripePriceFor(plan: 'plus' | 'premium'): string {
  return requireRuntimeValue(
    plan === 'plus' ? 'STRIPE_PLUS_PRICE_ID' : 'STRIPE_PREMIUM_PRICE_ID',
  );
}

// The plan a Stripe price grants. Unknown prices grant nothing.
export function planForPrice(priceId: string | null): Exclude<MembershipPlan, 'basic'> | null {
  if (!priceId) return null;
  if (priceId === runtimeEnv.STRIPE_PLUS_PRICE_ID?.trim()) return 'plus';
  if (priceId === runtimeEnv.STRIPE_PREMIUM_PRICE_ID?.trim()) return 'premium';
  return null;
}
