import type { MembershipPlan } from '../membership-store';

export type PaidPlan = Exclude<MembershipPlan, 'basic'>;

// A subscription as every provider must describe it. `plan` comes from the
// price actually billed; null means a price this site does not sell.
export type ProviderSubscription = {
  id: string | null;
  customerId: string | null;
  status: string;
  plan: PaidPlan | null;
  periodEnd: number | null;
};

// Webhook events reduced to the three things the site reacts to. `created`
// is in seconds and orders events that arrive out of sequence.
export type BillingEvent =
  | { kind: 'checkout_completed'; id: string; created: number; userId: string | null; email: string | null; subscriptionId: string | null }
  | { kind: 'subscription_changed' | 'subscription_deleted'; id: string; created: number; subscription: ProviderSubscription }
  // The notification only names the subscription; its state is read after
  // deduplication, so a repeated delivery costs no provider call.
  | { kind: 'subscription_notified'; id: string; created: number; subscriptionId: string }
  | { kind: 'ignored'; id: string; created: number };

// What a payment provider must offer. A new provider (iyzico, Paddle, ...) is
// one file implementing this, registered in ./index.ts; routes, membership
// rules, event ordering and deduplication stay as they are.
export interface BillingProvider {
  readonly name: string;
  // Whether every key and price this provider needs is set.
  configured(): boolean;
  createCheckout(input: { userId: string; email: string; customerId: string | null; plan: PaidPlan; origin: string }): Promise<string>;
  createPortal(input: { customerId: string; origin: string }): Promise<string>;
  getSubscription(subscriptionId: string): Promise<ProviderSubscription>;
  // Must succeed when the subscription is already canceled or gone.
  cancelSubscription(subscriptionId: string): Promise<void>;
  // null when the request is not authentic.
  parseWebhook(request: Request): Promise<BillingEvent | null>;
}
