import { reportError } from '@/lib/report-error';
import { billingProvider } from '@/lib/billing';
import { accountsDisabledResponse } from '@/lib/features';
import { authenticateRequest } from '@/lib/server-auth';
import { getMembership } from '@/lib/membership-store';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';
import { rateLimit } from '@/lib/shared-rate-limit';

export async function POST(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    const limited = await rateLimit(request, 'billing-checkout', user.id, 5);
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
    const url = await billingProvider().createCheckout({
      userId: user.id,
      email: user.email,
      customerId: membership?.stripeCustomerId ?? null,
      plan: body.plan,
      origin,
    });
    return privateJson({ url });
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    await reportError('billing_checkout_failed');
    return privateJson({ error: 'Checkout is currently unavailable. Please try again later.' }, 503);
  }
}
