import { runtimeEnv } from './runtime-config';
import { privateJson } from './private-response';

// Accounts (Google sign-in, saved portraits, membership and Stripe billing)
// stay off unless HOLYARTED_ACCOUNTS_ENABLED is exactly "true". With the flag
// off, every section is open and the app runs without any external service.
export function accountsEnabled(): boolean {
  return runtimeEnv.HOLYARTED_ACCOUNTS_ENABLED?.trim() === 'true';
}

// Account and billing routes answer 404 before touching auth, D1 or Stripe.
export function accountsDisabledResponse(): Response | null {
  return accountsEnabled() ? null : privateJson({ error: 'Not found.' }, 404);
}
