import { getMembership, publicMembership, type MembershipPlan } from './membership-store';
import { planIncludes } from './plans';
import { runtimeEnv } from './runtime-config';

export type GrantPlan = Exclude<MembershipPlan, 'basic'>;
export type MembershipGrant = {
  email: string;
  plan: GrantPlan;
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
};

type GrantRow = { email: string; plan: GrantPlan; expires_at: string | null; note: string | null; created_at: string };

function database(): D1Database {
  if (!runtimeEnv.DB) throw new Error('Membership database is unavailable.');
  return runtimeEnv.DB;
}

function fromRow(row: GrantRow): MembershipGrant {
  return { email: row.email, plan: row.plan, expiresAt: row.expires_at, note: row.note, createdAt: row.created_at };
}

// Sign-in providers return emails in any case; grants match regardless.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getActiveGrant(email: string, now = new Date()): Promise<MembershipGrant | null> {
  const row = await database()
    .prepare('SELECT email, plan, expires_at, note, created_at FROM membership_grants WHERE email = ? LIMIT 1')
    .bind(normalizeEmail(email))
    .first<GrantRow>();
  if (!row || (row.expires_at && row.expires_at <= now.toISOString())) return null;
  return fromRow(row);
}

export async function listGrants(): Promise<MembershipGrant[]> {
  const { results } = await database()
    .prepare('SELECT email, plan, expires_at, note, created_at FROM membership_grants ORDER BY created_at DESC')
    .bind()
    .all<GrantRow>();
  return results.map(fromRow);
}

export async function saveGrant(input: { email: string; plan: GrantPlan; expiresAt: string | null; note: string | null }): Promise<MembershipGrant> {
  const grant = { ...input, email: normalizeEmail(input.email), createdAt: new Date().toISOString() };
  await database()
    .prepare(
      `INSERT INTO membership_grants (email, plan, expires_at, note, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET plan = excluded.plan, expires_at = excluded.expires_at,
         note = excluded.note, created_at = excluded.created_at`,
    )
    .bind(grant.email, grant.plan, grant.expiresAt, grant.note, grant.createdAt)
    .run();
  return grant;
}

export async function deleteGrant(email: string): Promise<void> {
  await database().prepare('DELETE FROM membership_grants WHERE email = ?').bind(normalizeEmail(email)).run();
}

// The plan a person may use: the higher of what they pay for and what they
// were given. A grant never lowers a paid plan.
export function higherPlan(paid: MembershipPlan, grant: MembershipGrant | null): MembershipPlan {
  return grant && !planIncludes(paid, grant.plan) ? grant.plan : paid;
}

export type EffectiveMembership = {
  plan: MembershipPlan;
  status: string;
  currentPeriodEnd: number | null;
  // True when the plan comes from a grant: there is no billing to manage.
  granted: boolean;
  grantExpiresAt: string | null;
};

// The membership a signed-in person has, paid or granted, as the app shows it.
export async function membershipFor(user: { id: string; email: string }): Promise<EffectiveMembership> {
  const [membership, grant] = await Promise.all([getMembership(user.id), getActiveGrant(user.email)]);
  const paid = publicMembership(membership);
  const plan = higherPlan(paid.plan, grant);
  if (!grant || plan === paid.plan) return { ...paid, granted: false, grantExpiresAt: null };
  return { plan, status: 'active', currentPeriodEnd: null, granted: true, grantExpiresAt: grant.expiresAt };
}
