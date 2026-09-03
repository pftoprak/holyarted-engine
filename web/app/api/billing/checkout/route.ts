import { authenticateRequest } from '@/lib/server-auth';
import { getMembership } from '@/lib/membership-store';
import { stripePost, stripePriceFor } from '@/lib/stripe-api';

type CheckoutSession = { url: string | null };

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as { plan?: string };
    if (body.plan !== 'plus' && body.plan !== 'premium') {
      return Response.json({ error: 'Unknown membership plan.' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const membership = await getMembership(user.id);
    if (
      membership?.stripeCustomerId &&
      membership.plan !== 'basic' &&
      ['active', 'trialing', 'past_due'].includes(membership.status)
    ) {
      return Response.json(
        { error: 'Manage your existing membership from the billing portal.' },
        { status: 409 },
      );
    }
    const values = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': stripePriceFor(body.plan),
      'line_items[0][quantity]': '1',
      success_url: `${origin}/profile?checkout=success`,
      cancel_url: `${origin}/#membership`,
      client_reference_id: user.id,
      'metadata[user_id]': user.id,
      'metadata[plan]': body.plan,
      'subscription_data[metadata][user_id]': user.id,
      'subscription_data[metadata][plan]': body.plan,
      allow_promotion_codes: 'true',
    });
    if (membership?.stripeCustomerId) {
      values.set('customer', membership.stripeCustomerId);
    } else {
      values.set('customer_email', user.email);
    }

    const session = await stripePost<CheckoutSession>('checkout/sessions', values);
    if (!session.url) throw new Error('Checkout URL was not returned.');
    return Response.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
