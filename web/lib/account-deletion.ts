import { deleteMembership, getMembership } from './membership-store';
import { deletePortrait } from './portrait-store';
import { stripeDelete } from './stripe-api';
import { deleteSupabaseUser } from './supabase-admin';
import { requireRuntimeValue } from './runtime-config';

export async function deleteAccount(userId: string): Promise<void> {
  // Fail before touching D1 if the irreversible provider operation is not configured.
  requireRuntimeValue('SUPABASE_SERVICE_ROLE_KEY');
  const membership = await getMembership(userId);
  const paid = membership && membership.plan !== 'basic' && ['active', 'trialing', 'past_due'].includes(membership.status);
  if (paid && membership.stripeSubscriptionId) {
    await stripeDelete(`subscriptions/${encodeURIComponent(membership.stripeSubscriptionId)}`);
  }

  await deletePortrait(userId);
  await deleteMembership(userId);
  await deleteSupabaseUser(userId);
}
