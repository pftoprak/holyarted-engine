import { requireRuntimeValue, runtimeEnv } from '../runtime-config';
import { planForPrice, stripeDelete, stripeGet, stripePost, stripePriceFor, StripeRequestError } from '../stripe-api';
import type { BillingEvent, BillingProvider, ProviderSubscription } from './provider';

type StripeEvent = { id: string; type: string; created: number; data: { object: Record<string, unknown> } };
type SubscriptionItem = { price?: { id?: unknown }; current_period_end?: unknown };
type StripeSubscription = {
  id?: unknown;
  customer?: unknown;
  status?: unknown;
  current_period_end?: unknown;
  items?: { data?: SubscriptionItem[] };
};

// Repeated clicks within the same ten minutes reuse one checkout session.
const CHECKOUT_REUSE_MS = 10 * 60_000;
const SIGNATURE_TOLERANCE_S = 300;

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(requireRuntimeValue('STRIPE_WEBHOOK_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((candidate) => safeEqual(candidate, expected));
}

// Webhook payloads follow the endpoint's API version: the period end sits on
// the subscription in older versions and on its item in newer ones.
function normalize(subscription: StripeSubscription): ProviderSubscription {
  const item = subscription.items?.data?.[0];
  const periodEnd = subscription.current_period_end ?? item?.current_period_end;
  return {
    id: textValue(subscription.id),
    customerId: textValue(subscription.customer),
    status: textValue(subscription.status) || 'incomplete',
    plan: planForPrice(textValue(item?.price?.id)),
    periodEnd: typeof periodEnd === 'number' ? periodEnd : null,
  };
}

export const stripeProvider: BillingProvider = {
  name: 'stripe',

  configured() {
    const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PLUS_PRICE_ID, STRIPE_PREMIUM_PRICE_ID } = runtimeEnv;
    return [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PLUS_PRICE_ID, STRIPE_PREMIUM_PRICE_ID].every((value) => Boolean(value?.trim()));
  },

  async createCheckout({ userId, email, customerId, plan, origin }) {
    const values = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': stripePriceFor(plan),
      'line_items[0][quantity]': '1',
      success_url: `${origin}/profile?checkout=success`,
      cancel_url: `${origin}/#membership`,
      client_reference_id: userId,
      'metadata[user_id]': userId,
      'subscription_data[metadata][user_id]': userId,
      allow_promotion_codes: 'true',
    });
    if (customerId) values.set('customer', customerId);
    else values.set('customer_email', email);
    const idempotencyKey = `checkout-${userId}-${plan}-${Math.floor(Date.now() / CHECKOUT_REUSE_MS)}`;
    const session = await stripePost<{ url: string | null }>('checkout/sessions', values, idempotencyKey);
    if (!session.url) throw new Error('Checkout URL was not returned.');
    return session.url;
  },

  async createPortal({ customerId, origin }) {
    const values = new URLSearchParams({ customer: customerId, return_url: `${origin}/profile` });
    const session = await stripePost<{ url: string | null }>('billing_portal/sessions', values);
    if (!session.url) throw new Error('Billing portal URL was not returned.');
    return session.url;
  },

  async getSubscription(subscriptionId) {
    return normalize(await stripeGet<StripeSubscription>(`subscriptions/${encodeURIComponent(subscriptionId)}`));
  },

  async cancelSubscription(subscriptionId) {
    try {
      await stripeDelete(`subscriptions/${encodeURIComponent(subscriptionId)}`);
    } catch (error) {
      // Already canceled or removed in Stripe: billing is stopped either way.
      if (!(error instanceof StripeRequestError && error.code === 'resource_missing')) throw error;
    }
  },

  async parseWebhook(request): Promise<BillingEvent | null> {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature || !(await verifySignature(body, signature))) return null;
    const event = JSON.parse(body) as StripeEvent;
    const { id, created } = event;
    const object = event.data.object;
    if (event.type === 'checkout.session.completed') {
      const metadata = (object.metadata ?? {}) as Record<string, unknown>;
      const details = (object.customer_details ?? {}) as Record<string, unknown>;
      return {
        kind: 'checkout_completed',
        id,
        created,
        userId: textValue(object.client_reference_id) || textValue(metadata.user_id),
        email: textValue(details.email) || textValue(object.customer_email),
        subscriptionId: textValue(object.subscription),
      };
    }
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      return { kind: 'subscription_changed', id, created, subscription: normalize(object as StripeSubscription) };
    }
    if (event.type === 'customer.subscription.deleted') {
      return { kind: 'subscription_deleted', id, created, subscription: normalize(object as StripeSubscription) };
    }
    return { kind: 'ignored', id, created };
  },
};
