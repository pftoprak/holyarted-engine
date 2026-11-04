import { billingProvider } from '@/lib/billing';
import { accountsDisabledResponse } from '@/lib/features';
import { getMembership } from '@/lib/membership-store';
import { privateJson } from '@/lib/private-response';
import { authenticateRequest } from '@/lib/server-auth';
import { rateLimit } from '@/lib/shared-rate-limit';

export async function POST(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    const limited = await rateLimit(request, 'billing-portal', user.id, 10);
    if (limited) return limited;
    const membership = await getMembership(user.id);
    if (!membership?.stripeCustomerId) {
      return privateJson({ error: 'No paid membership found.' }, 404);
    }
    const url = await billingProvider().createPortal({ customerId: membership.stripeCustomerId, origin: new URL(request.url).origin });
    return privateJson({ url });
  } catch {
    console.error('billing_portal_failed');
    return privateJson({ error: 'Billing management is currently unavailable. Please try again later.' }, 503);
  }
}
