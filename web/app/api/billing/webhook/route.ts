import { accountsDisabledResponse } from '@/lib/features';
import {
  getMembership,
  getMembershipByCustomer,
  recordStripeEvent,
  stripeEventApplied,
  upsertMembership,
} from '@/lib/membership-store';
import { planForPrice, stripeGet } from '@/lib/stripe-api';
import { requireRuntimeValue } from '@/lib/runtime-config';
import { privateJson } from '@/lib/private-response';

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
};

type SubscriptionItem = { price?: { id?: unknown }; current_period_end?: unknown };
type Subscription = {
  id?: unknown;
  customer?: unknown;
  status?: unknown;
  metadata?: Record<string, unknown>;
  current_period_end?: unknown;
  items?: { data?: SubscriptionItem[] };
};

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const secret = requireRuntimeValue('STRIPE_WEBHOOK_SECRET');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return signatures.some((candidate) => safeEqual(candidate, expected));
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

// Writes the subscription's current state. The plan comes from the price
// actually billed, never from metadata, and an older event never overwrites
// state written by a newer one.
async function applySubscription(
  event: StripeEvent,
  userId: string,
  email: string,
  subscription: Subscription,
): Promise<void> {
  const existing = await getMembership(userId);
  if (existing?.billingEventAt && event.created < existing.billingEventAt) return;
  const item = subscription.items?.data?.[0];
  const plan = planForPrice(textValue(item?.price?.id));
  if (!plan) console.error('billing_unknown_price');
  const periodEnd = subscription.current_period_end ?? item?.current_period_end;
  await upsertMembership({
    userId,
    email,
    plan: plan ?? 'basic',
    status: event.type === 'customer.subscription.deleted' ? 'canceled' : textValue(subscription.status) || 'incomplete',
    stripeCustomerId: textValue(subscription.customer),
    stripeSubscriptionId: textValue(subscription.id),
    currentPeriodEnd: typeof periodEnd === 'number' ? periodEnd : null,
    billingEventAt: event.created,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature || !(await verifySignature(body, signature))) {
      return privateJson({ error: 'Invalid signature.' }, 400);
    }

    const event = JSON.parse(body) as StripeEvent;
    if (await stripeEventApplied(event.id)) return privateJson({ received: true });
    const object = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const metadata = (object.metadata ?? {}) as Record<string, unknown>;
      const userId = textValue(object.client_reference_id) || textValue(metadata.user_id);
      const subscriptionId = textValue(object.subscription);
      const details = (object.customer_details ?? {}) as Record<string, unknown>;
      const email = textValue(details.email) || textValue(object.customer_email);
      // Without a subscription there is nothing paid to record.
      if (userId && subscriptionId && email) {
        // Read the live subscription: the session alone does not say which
        // price was billed, and later events may already have changed it.
        const subscription = await stripeGet<Subscription>(`subscriptions/${encodeURIComponent(subscriptionId)}`);
        await applySubscription(event, userId, email, subscription);
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = object as Subscription;
      const customer = textValue(subscription.customer);
      const existing = customer ? await getMembershipByCustomer(customer) : null;
      // Before checkout completes there is no email yet; the checkout event
      // reads the live subscription, so nothing is lost by waiting for it.
      if (existing) await applySubscription(event, existing.userId, existing.email, subscription);
    }

    await recordStripeEvent(event.id);
    return privateJson({ received: true });
  } catch {
    console.error('billing_webhook_failed');
    return privateJson({ error: 'Webhook processing failed.' }, 500);
  }
}
