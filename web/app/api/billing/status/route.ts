import { reportError } from '@/lib/report-error';
import { accountsDisabledResponse } from '@/lib/features';
import { authenticateRequest } from '@/lib/server-auth';
import { membershipFor } from '@/lib/membership-grants';
import { privateJson } from '@/lib/private-response';

export async function GET(request: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    return privateJson(await membershipFor(user));
  } catch {
    await reportError('membership_load_failed');
    return privateJson({ error: 'Your membership could not be opened.' }, 503);
  }
}
