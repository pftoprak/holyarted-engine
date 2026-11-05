import { accountsEnabled } from './features';
import { membershipFor } from './membership-grants';
import type { MembershipPlan } from './membership-store';
import { authenticateRequest } from './server-auth';

export type PlanAccess = { plan: MembershipPlan; userId: string | null };

// The plan a request may be served, decided on the server only. Visitors
// without a valid session get Basic; paid and granted plans both count.
// Auth or database failures throw, so callers fail closed instead of
// guessing a plan.
export async function requestPlan(request: Request): Promise<PlanAccess> {
  if (!accountsEnabled()) return { plan: 'premium', userId: null };
  const user = await authenticateRequest(request);
  if (!user) return { plan: 'basic', userId: null };
  return { plan: (await membershipFor(user)).plan, userId: user.id };
}
