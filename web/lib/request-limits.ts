const WINDOW_MS = 60_000;

// Counts one request for `key` in the fixed window starting at `windowStart`
// and returns the new count for that window.
export type Counter = (key: string, windowStart: number) => Promise<number>;

const buckets = new Map<string, { windowStart: number; count: number }>();

// Per-process fallback for local development and store outages.
export const memoryCounter: Counter = async (key, windowStart) => {
  const current = buckets.get(key);
  const bucket = current?.windowStart === windowStart ? current : { windowStart, count: 0 };
  bucket.count += 1;
  buckets.set(key, bucket);
  if (buckets.size > 10_000) {
    for (const [stale, value] of buckets) if (value.windowStart < windowStart) buckets.delete(stale);
  }
  return bucket.count;
};

function clientKey(request: Request): string {
  // Cloudflare supplies this header at the edge. The fallback keeps local
  // development deterministic without trusting arbitrary forwarded headers.
  return request.headers.get('cf-connecting-ip')?.trim() || 'local-client';
}

// Client addresses are personal data: counters only ever see a hash.
async function hashedKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  identity: string,
  limit: number,
  counter: Counter = memoryCounter,
): Promise<Response | null> {
  const now = Date.now();
  const windowStart = now - (now % WINDOW_MS);
  const key = await hashedKey(`${scope}:${identity}:${clientKey(request)}`);
  if ((await counter(key, windowStart)) <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000));
  return Response.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'retry-after': String(retryAfter),
        'x-content-type-options': 'nosniff',
      },
    },
  );
}
