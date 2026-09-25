const WINDOW_MS = 60_000;
const buckets = new Map<string, { startedAt: number; count: number }>();

function clientKey(request: Request): string {
  // Cloudflare supplies this header at the edge. The fallback keeps local
  // development deterministic without trusting arbitrary forwarded headers.
  return request.headers.get('cf-connecting-ip')?.trim() || 'local-client';
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  identity: string,
  limit: number,
): Response | null {
  const now = Date.now();
  const key = `${scope}:${identity}:${clientKey(request)}`;
  const current = buckets.get(key);
  const bucket = !current || now - current.startedAt >= WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count <= limit) return null;
  const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.startedAt)) / 1000));
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
