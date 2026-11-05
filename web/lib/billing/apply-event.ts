import { reportError } from '../report-error';
import {
  billingEventApplied,
  getMembership,
  getMembershipByCustomer,
  recordBillingEvent,
  upsertMembership,
} from '../membership-store';
import type { BillingEvent, BillingProvider, ProviderSubscription } from './provider';

// Writes a subscription's state. An older event never overwrites state
// written by a newer one, and an unknown price grants nothing.
async function applySubscription(
  event: BillingEvent,
  userId: string,
  email: string,
  subscription: ProviderSubscription,
): Promise<void> {
  const existing = await getMembership(userId);
  if (existing?.billingEventAt && event.created < existing.billingEventAt) return;
  if (!subscription.plan) await reportError('billing_unknown_price');
  await upsertMembership({
    userId,
    email,
    plan: subscription.plan ?? 'basic',
    status: event.kind === 'subscription_deleted' ? 'canceled' : subscription.status,
    stripeCustomerId: subscription.customerId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.periodEnd,
    billingEventAt: event.created,
    updatedAt: new Date().toISOString(),
  });
}

// Provider-independent handling of a verified webhook event. Providers retry
// deliveries, so an event is recorded only after it has been applied.
export async function applyBillingEvent(provider: BillingProvider, event: BillingEvent): Promise<void> {
  if (await billingEventApplied(event.id)) return;
  if (event.kind === 'checkout_completed') {
    // Without a subscription there is nothing paid to record. The live
    // subscription is read because the checkout alone does not say which
    // price was billed, and later events may already have changed it.
    if (event.userId && event.email && event.subscriptionId) {
      await applySubscription(event, event.userId, event.email, await provider.getSubscription(event.subscriptionId));
    }
  } else if (event.kind === 'subscription_notified') {
    const subscription = await provider.getSubscription(event.subscriptionId);
    const existing = subscription.customerId ? await getMembershipByCustomer(subscription.customerId) : null;
    if (existing) await applySubscription(event, existing.userId, existing.email, subscription);
  } else if (event.kind !== 'ignored') {
    // Before checkout completes there is no membership (and no email) yet;
    // the checkout event reads the live subscription, so nothing is lost.
    const existing = event.subscription.customerId ? await getMembershipByCustomer(event.subscription.customerId) : null;
    if (existing) await applySubscription(event, existing.userId, existing.email, event.subscription);
  }
  await recordBillingEvent(event.id);
}
