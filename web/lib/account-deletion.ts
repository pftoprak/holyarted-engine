import { billingProvider } from './billing';
import { deleteGrant } from './membership-grants';
import { deleteMembership, getMembership } from './membership-store';
import { deletePortrait } from './portrait-store';
import { requireRuntimeValue, runtimeEnv } from './runtime-config';
import { deleteSupabaseUser } from './supabase-admin';

function database(): D1Database {
  if (!runtimeEnv.DB) throw new Error('Account database is unavailable.');
  return runtimeEnv.DB;
}

// Records the attempt and returns whether billing was already stopped by an
// earlier attempt. The row lives until the last step succeeds, so pending
// deletions stay visible (docs/OPERATIONS.md) and every step can be repeated.
async function beginDeletion(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const row = await database()
    .prepare(
      `INSERT INTO account_deletions (user_id, requested_at, billing_canceled, attempts, last_attempt_at)
       VALUES (?, ?, 0, 1, ?)
       ON CONFLICT(user_id) DO UPDATE SET attempts = attempts + 1, last_attempt_at = excluded.last_attempt_at
       RETURNING billing_canceled`,
    )
    .bind(userId, now, now)
    .first<{ billing_canceled: number }>();
  return row?.billing_canceled === 1;
}

async function stopBilling(userId: string): Promise<void> {
  const membership = await getMembership(userId);
  const paid = membership && membership.plan !== 'basic' && ['active', 'trialing', 'past_due'].includes(membership.status);
  if (paid) {
    // An inconsistent billing record must not erase the reference needed to
    // resolve a potentially live subscription and stop future charges.
    if (!membership.stripeSubscriptionId) throw new Error('Subscription reference is unavailable.');
    await billingProvider().cancelSubscription(membership.stripeSubscriptionId);
  }
  await database().prepare('UPDATE account_deletions SET billing_canceled = 1 WHERE user_id = ?').bind(userId).run();
}

export async function deleteAccount(userId: string, email: string): Promise<void> {
  // Fail before touching D1 if the irreversible provider operation is not configured.
  requireRuntimeValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!(await beginDeletion(userId))) await stopBilling(userId);
  await deletePortrait(userId);
  await deleteMembership(userId);
  await deleteGrant(email);
  await deleteSupabaseUser(userId);
  await database().prepare('DELETE FROM account_deletions WHERE user_id = ?').bind(userId).run();
}
