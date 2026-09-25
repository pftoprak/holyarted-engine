import { authenticateRequest } from '@/lib/server-auth';
import { getMembership } from '@/lib/membership-store';
import { stripePost } from '@/lib/stripe-api';
import { privateJson } from '@/lib/private-response';

type PortalSession = { url: string | null };

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    const membership = await getMembership(user.id);
    if (!membership?.stripeCustomerId) {
      return privateJson({ error: 'No paid membership found.' }, 404);
    }

    const values = new URLSearchParams({
      customer: membership.stripeCustomerId,
      return_url: `${new URL(request.url).origin}/profile`,
    });
    const session = await stripePost<PortalSession>(
      'billing_portal/sessions',
      values,
    );
    if (!session.url) throw new Error('Billing portal URL was not returned.');
    return privateJson({ url: session.url });
  } catch (error) {
    console.error('billing_portal_failed');
    return privateJson({ error: 'Billing management is currently unavailable. Please try again later.' }, 503);
  }
}
