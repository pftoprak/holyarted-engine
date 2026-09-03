import { authenticateRequest } from '@/lib/server-auth';
import { getMembership } from '@/lib/membership-store';
import { stripePost } from '@/lib/stripe-api';

type PortalSession = { url: string | null };

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const membership = await getMembership(user.id);
    if (!membership?.stripeCustomerId) {
      return Response.json({ error: 'No paid membership found.' }, { status: 404 });
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
    return Response.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Portal failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
