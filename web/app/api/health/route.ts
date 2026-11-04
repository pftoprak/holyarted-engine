import { reportError } from '@/lib/report-error';
import { accountsEnabled } from '@/lib/features';
import { getPublicAuthConfig, runtimeEnv } from '@/lib/runtime-config';
import { privateJson } from '@/lib/private-response';

export async function GET() {
  try {
    // Without accounts, or without sign-in configured (a free-only site), the
    // app depends on no external service or database.
    if (!accountsEnabled() || !getPublicAuthConfig()) return privateJson({ status: 'ok' });
    if (!runtimeEnv.DB) {
      return privateJson({ status: 'unavailable' }, 503);
    }
    await runtimeEnv.DB.prepare('SELECT 1').bind().first();
    return privateJson({ status: 'ok' });
  } catch {
    await reportError('health_check_failed');
    return privateJson({ status: 'unavailable' }, 503);
  }
}
