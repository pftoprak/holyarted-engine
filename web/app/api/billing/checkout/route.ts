import { authenticateRequest } from '@/lib/server-auth';
import { getMembership } from '@/lib/membership-store';
import { stripePost, stripePriceFor } from '@/lib/stripe-api';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';
import { enforceRateLimit } from '@/lib/request-limits';

type CheckoutSession = { url: string | null };

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    const limited = enforceRateLimit(request, 'billing-checkout', user.id, 5);
    if (limited) return limited;

    const body = (await readSmallJson(request)) as { plan?: string } | null;
    if (body?.plan !== 'plus' && body?.plan !== 'premium') {
      return privateJson({ error: 'Unknown membership plan.' }, 400);
    }

    const origin = new URL(request.url).origin;
    const membership = await getMembership(user.id);
    if (
      membership?.stripeCustomerId &&
      membership.plan !== 'basic' &&
      ['active', 'trialing', 'past_due'].includes(membership.status)
    ) {
      return privateJson(
        { error: 'Manage your existing membership from the billing portal.' },
        409,
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
    return privateJson({ url: session.url });
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    console.error('billing_checkout_failed');
    return privateJson({ error: 'Checkout is currently unavailable. Please try again later.' }, 503);
  }
}
