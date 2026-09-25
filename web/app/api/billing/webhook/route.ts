import {
  getMembershipByCustomer,
  type MembershipPlan,
  upsertMembership,
} from '@/lib/membership-store';
import { requireRuntimeValue } from '@/lib/runtime-config';
import { privateJson } from '@/lib/private-response';

type StripeEvent = {
  type: string;
  data: { object: Record<string, unknown> };
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

function planValue(value: unknown): MembershipPlan {
  return value === 'premium' ? 'premium' : value === 'plus' ? 'plus' : 'basic';
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature || !(await verifySignature(body, signature))) {
      return privateJson({ error: 'Invalid signature.' }, 400);
    }

    const event = JSON.parse(body) as StripeEvent;
    const object = event.data.object;
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;

    if (event.type === 'checkout.session.completed') {
      const userId = textValue(object.client_reference_id) || textValue(metadata.user_id);
      const customer = textValue(object.customer);
      const subscription = textValue(object.subscription);
      const details = (object.customer_details ?? {}) as Record<string, unknown>;
      const email = textValue(details.email) || textValue(object.customer_email);
      if (userId && customer && email) {
        await upsertMembership({
          userId,
          email,
          plan: planValue(metadata.plan),
          status: 'active',
          stripeCustomerId: customer,
          stripeSubscriptionId: subscription,
          currentPeriodEnd: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const customer = textValue(object.customer);
      const existing = customer ? await getMembershipByCustomer(customer) : null;
      const userId = textValue(metadata.user_id) || existing?.userId;
      const email = existing?.email;
      if (userId && email) {
        await upsertMembership({
          userId,
          email,
          plan: planValue(metadata.plan || existing?.plan),
          status:
            event.type === 'customer.subscription.deleted'
              ? 'canceled'
              : textValue(object.status) || 'active',
          stripeCustomerId: customer,
          stripeSubscriptionId: textValue(object.id),
          currentPeriodEnd:
            typeof object.current_period_end === 'number'
              ? object.current_period_end
              : null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return privateJson({ received: true });
  } catch (error) {
    console.error('billing_webhook_failed');
    return privateJson({ error: 'Webhook processing failed.' }, 500);
  }
}
