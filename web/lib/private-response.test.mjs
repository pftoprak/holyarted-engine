import assert from 'node:assert/strict';
import test from 'node:test';
import { privateJson, readSmallJson, RequestBodyError } from './private-response.ts';
import { enforceRateLimit } from './request-limits.ts';

const request = (body, headers = {}) => new Request('https://example.test/api/portrait', {
  method: 'PUT', body, headers: { 'content-type': 'application/json', ...headers },
});
test('personal data and error responses are never cacheable', () => {
  for (const status of [200, 400, 401, 503]) {
    const response = privateJson({ example: true }, status);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.status, status);
  }
});
test('accepts small JSON including Turkish names', async () => {
  assert.deepEqual(await readSmallJson(request('{"name":"İpek"}')), { name: 'İpek' });
});
test('rejects oversized bodies with missing or misleading length', async () => {
  for (const headers of [{}, { 'content-length': '1' }, { 'content-length': '9000' }]) {
    await assert.rejects(readSmallJson(request(' '.repeat(4097), headers)),
      error => error instanceof RequestBodyError && error.status === 413);
  }
});
test('rejects unsupported content and malformed JSON', async () => {
  await assert.rejects(readSmallJson(request('{}', { 'content-type': 'text/plain' })), error => error.status === 415);
  await assert.rejects(readSmallJson(request('{')), error => error.status === 400);
});
test('rate limits sensitive requests and returns a retry window', () => {
  const scope = `test-${crypto.randomUUID()}`;
  const input = new Request('https://example.test/api/account', { method: 'DELETE' });
  assert.equal(enforceRateLimit(input, scope, 'user-1', 2), null);
  assert.equal(enforceRateLimit(input, scope, 'user-1', 2), null);
  const response = enforceRateLimit(input, scope, 'user-1', 2);
  assert.equal(response?.status, 429);
  assert.equal(response?.headers.get('cache-control'), 'no-store');
  assert.match(response?.headers.get('retry-after') || '', /^\d+$/);
});
