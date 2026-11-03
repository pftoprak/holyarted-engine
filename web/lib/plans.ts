import type { MembershipPlan } from './membership-store';

export type { MembershipPlan };

const rank: Record<MembershipPlan, number> = { basic: 0, plus: 1, premium: 2 };

// Pure and client-safe: whether a plan includes content of the given tier.
export function planIncludes(plan: MembershipPlan, tier: MembershipPlan): boolean {
  return rank[plan] >= rank[tier];
}
