import { reportError } from '@/lib/report-error';
import { accountsDisabledResponse } from '@/lib/features';
import { authenticateRequest } from '@/lib/server-auth';
import { deleteAccount } from '@/lib/account-deletion';
import { privateJson } from '@/lib/private-response';
import { rateLimit } from '@/lib/shared-rate-limit';

export async function DELETE(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    const limited = await rateLimit(request, 'account-delete', user.id, 3);
    if (limited) return limited;
    await deleteAccount(user.id, user.email);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  } catch {
    await reportError('account_delete_failed');
    return privateJson({ error: 'Account deletion is currently unavailable.' }, 503);
  }
}
