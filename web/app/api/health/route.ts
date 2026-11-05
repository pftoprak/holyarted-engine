import { reportError } from '@/lib/report-error';
import { accountsEnabled } from '@/lib/features';
import { getPublicAuthConfig, runtimeEnv } from '@/lib/runtime-config';
import { privateJson } from '@/lib/private-response';

// Tables the signed-in features need (web/drizzle 0000-0003). If a deploy
// left a migration unapplied, the site reports an outage instead of "ok".
const REQUIRED_TABLES = ['memberships', 'portraits', 'stripe_events', 'rate_limits', 'account_deletions', 'membership_grants'];

export async function GET() {
  try {
    // Without accounts, or without sign-in configured (a free-only site), the
    // app depends on no external service or database.
    if (!accountsEnabled() || !getPublicAuthConfig()) return privateJson({ status: 'ok' });
    if (!runtimeEnv.DB) {
      return privateJson({ status: 'unavailable' }, 503);
    }
    const found = await runtimeEnv.DB
      .prepare(`SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_TABLES.map(() => '?').join(',')})`)
      .bind(...REQUIRED_TABLES)
      .first<{ count: number }>();
    if (Number(found?.count) !== REQUIRED_TABLES.length) {
      await reportError('health_schema_incomplete');
      return privateJson({ status: 'unavailable' }, 503);
    }
    // Column added by migration 0002; this fails if it is missing.
    await runtimeEnv.DB.prepare('SELECT billing_event_at FROM memberships LIMIT 1').bind().first();
    return privateJson({ status: 'ok' });
  } catch {
    await reportError('health_check_failed');
    return privateJson({ status: 'unavailable' }, 503);
  }
}
