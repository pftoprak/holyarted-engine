import { runtimeEnv } from './runtime-config';

export type MembershipPlan = 'basic' | 'plus' | 'premium';

export type Membership = {
  userId: string;
  email: string;
  plan: MembershipPlan;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
  updatedAt: string;
};

type MembershipRow = {
  user_id: string;
  email: string;
  plan: MembershipPlan;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: number | null;
  updated_at: string;
};

function database(): D1Database {
  if (!runtimeEnv.DB) throw new Error('Membership database is unavailable.');
  return runtimeEnv.DB;
}

function fromRow(row: MembershipRow): Membership {
  return {
    userId: row.user_id,
    email: row.email,
    plan: row.plan,
    status: row.status,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
    updatedAt: row.updated_at,
  };
}

export async function getMembership(
  userId: string,
): Promise<Membership | null> {
  const row = await database()
    .prepare(
      `SELECT user_id, email, plan, status, stripe_customer_id,
        stripe_subscription_id, current_period_end, updated_at
       FROM memberships WHERE user_id = ? LIMIT 1`,
    )
    .bind(userId)
    .first<MembershipRow>();
  return row ? fromRow(row) : null;
}

export async function getMembershipByCustomer(
  stripeCustomerId: string,
): Promise<Membership | null> {
  const row = await database()
    .prepare(
      `SELECT user_id, email, plan, status, stripe_customer_id,
        stripe_subscription_id, current_period_end, updated_at
       FROM memberships WHERE stripe_customer_id = ? LIMIT 1`,
    )
    .bind(stripeCustomerId)
    .first<MembershipRow>();
  return row ? fromRow(row) : null;
}

export async function upsertMembership(input: Membership): Promise<void> {
  await database()
    .prepare(
      `INSERT INTO memberships (
        user_id, email, plan, status, stripe_customer_id,
        stripe_subscription_id, current_period_end, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email = excluded.email,
        plan = excluded.plan,
        status = excluded.status,
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_subscription_id = excluded.stripe_subscription_id,
        current_period_end = excluded.current_period_end,
        updated_at = excluded.updated_at`,
    )
    .bind(
      input.userId,
      input.email,
      input.plan,
      input.status,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
      input.currentPeriodEnd,
      input.updatedAt,
    )
    .run();
}

export async function deleteMembership(userId: string): Promise<void> {
  await database().prepare('DELETE FROM memberships WHERE user_id = ?').bind(userId).run();
}

export function publicMembership(
  membership: Membership | null,
): Pick<Membership, 'plan' | 'status' | 'currentPeriodEnd'> {
  if (!membership) {
    return { plan: 'basic', status: 'active', currentPeriodEnd: null };
  }
  const paidAccess = ['active', 'trialing', 'past_due'].includes(
    membership.status,
  );
  return {
    plan: paidAccess ? membership.plan : 'basic',
    status: membership.status,
    currentPeriodEnd: membership.currentPeriodEnd,
  };
}
