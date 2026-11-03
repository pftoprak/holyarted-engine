import { runtimeEnv } from './runtime-config';
import { privateJson } from './private-response';

// Accounts (Google sign-in, saved portraits, membership and Stripe billing)
// are on unless HOLYARTED_ACCOUNTS_ENABLED is exactly "false". That open mode
// is for local development only: every paid section is served to everyone and
// no external service is called. Never set it on a deployed environment.
export function accountsEnabled(): boolean {
  return runtimeEnv.HOLYARTED_ACCOUNTS_ENABLED?.trim() !== 'false';
}

// Account and billing routes answer 404 before touching auth, D1 or Stripe.
export function accountsDisabledResponse(): Response | null {
  return accountsEnabled() ? null : privateJson({ error: 'Not found.' }, 404);
}
