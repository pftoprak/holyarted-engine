import type { BillingProvider } from './provider';
import { iyzicoProvider } from './iyzico';
import { runtimeEnv } from '../runtime-config';
import { stripeProvider } from './stripe';

export type { BillingEvent, BillingProvider, PaidPlan, ProviderSubscription } from './provider';

// The single place that decides which payment provider the site uses:
// iyzico (founder decision, 4 Nov 2026) unless BILLING_PROVIDER is "stripe".
// Adding one: implement BillingProvider in its own file and return it here.
export function billingProvider(): BillingProvider {
  return runtimeEnv.BILLING_PROVIDER?.trim() === 'stripe' ? stripeProvider : iyzicoProvider;
}

// Purchases are offered only when sign-in works and the provider is fully set up.
export function purchasesAvailable(accounts: boolean): boolean {
  return accounts && billingProvider().configured();
}
