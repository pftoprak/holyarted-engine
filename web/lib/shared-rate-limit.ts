import { accountsEnabled } from './features';
import { enforceRateLimit, memoryCounter, type Counter } from './request-limits';
import { runtimeEnv } from './runtime-config';

const STALE_AFTER_MS = 60 * 60_000;
const CLEANUP_SHARE = 0.01;

// One counter in D1 for every server instance. If D1 fails, requests are
// still limited per instance rather than blocked or left unlimited.
const d1Counter = (db: D1Database): Counter => async (key, windowStart) => {
  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
           window_start = excluded.window_start
         RETURNING count`,
      )
      .bind(key, windowStart)
      .first<{ count: number }>();
    if (Math.random() < CLEANUP_SHARE) {
      await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(windowStart - STALE_AFTER_MS).run();
    }
    return row?.count ?? memoryCounter(key, windowStart);
  } catch {
    console.error('rate_limit_store_failed');
    return memoryCounter(key, windowStart);
  }
};

export function rateLimit(request: Request, scope: string, identity: string, limit: number): Promise<Response | null> {
  const db = accountsEnabled() ? runtimeEnv.DB : undefined;
  return enforceRateLimit(request, scope, identity, limit, db ? d1Counter(db) : memoryCounter);
}
