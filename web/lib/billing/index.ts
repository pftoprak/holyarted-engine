import type { BillingProvider } from './provider';
import { stripeProvider } from './stripe';

export type { BillingEvent, BillingProvider, PaidPlan, ProviderSubscription } from './provider';

// The single place that decides which payment provider the site uses.
// Adding one: implement BillingProvider in its own file and return it here.
export function billingProvider(): BillingProvider {
  return stripeProvider;
}

// Purchases are offered only when sign-in works and the provider is fully set up.
export function purchasesAvailable(accounts: boolean): boolean {
  return accounts && billingProvider().configured();
}
