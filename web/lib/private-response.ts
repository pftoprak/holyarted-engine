export function privateJson(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return Response.json(data, { status, headers });
}

export class RequestBodyError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Count actual streamed bytes, not just the client-supplied Content-Length.
export async function readSmallJson(request: Request, limit = 4096): Promise<unknown> {
  const mediaType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new RequestBodyError('Please send JSON data.', 415);
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (declaredLength > limit) {
    await request.body?.cancel();
    throw new RequestBodyError('The submitted data is too large.', 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError('Please provide valid JSON data.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestBodyError('The submitted data is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new RequestBodyError('Please provide valid JSON data.', 400);
  }
}
