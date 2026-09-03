import { requireRuntimeValue } from './runtime-config';

type StripeError = { error?: { message?: string } };

export async function stripePost<T>(
  path: string,
  values: URLSearchParams,
): Promise<T> {
  const secret = requireRuntimeValue('STRIPE_SECRET_KEY');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${secret}:`)}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: values,
  });
  const payload = (await response.json()) as T & StripeError;
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Stripe request failed.');
  }
  return payload;
}

export function stripePriceFor(plan: 'plus' | 'premium'): string {
  return requireRuntimeValue(
    plan === 'plus' ? 'STRIPE_PLUS_PRICE_ID' : 'STRIPE_PREMIUM_PRICE_ID',
  );
}
