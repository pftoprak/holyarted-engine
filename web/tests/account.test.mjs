import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const people = {
  alice: { id: 'test-alice', email: 'alice@example.test', user_metadata: { full_name: 'Alice Test' } },
  bob: { id: 'test-bob', email: 'bob@example.test', user_metadata: { full_name: 'Bob Test' } },
};
const input = { firstName: 'Ada', lastName: 'Yılmaz', birthDate: '1990-01-05' };

// Use the real migrations and SQL with an in-memory SQLite database. Only the
// D1 transport and Supabase HTTP boundary are replaced; route/store/auth code runs.
async function fixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  for (const file of ['0000_bizarre_cable.sql', '0001_youthful_prism.sql']) {
    db.exec(readFileSync(path.join(root, 'drizzle', file), 'utf8'));
  }
  const faults = { database: false, auth: false };
  const logs = [];
  const env = {
    SUPABASE_URL: 'https://auth.example.test',
    SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
    DB: {
      prepare(sql) {
        if (faults.database) throw new Error('database failed: alice@example.test 1990-01-05');
        return {
          bind(...values) {
            return {
              async first() { return db.prepare(sql).get(...values) ?? null; },
              async run() { db.prepare(sql).run(...values); return { success: true }; },
            };
          },
        };
      },
    },
  };
  const context = vm.createContext({
    Request, Response, Headers, AbortSignal, TextEncoder, TextDecoder, Uint8Array,
    console: { error: (...args) => logs.push(args.map(String).join(' ')) },
    fetch: async (url, init) => {
      assert.equal(url, 'https://auth.example.test/auth/v1/user');
      assert.equal(init.headers.apikey, 'test-public-key');
      if (faults.auth) throw new Error('auth failed: Bearer private-test-token');
      const token = init.headers.authorization?.replace(/^Bearer /, '');
      return people[token] ? Response.json(people[token]) : Response.json({}, { status: 401 });
    },
  });
  const modules = new Map();
  const runtime = new vm.SyntheticModule(['env'], function () { this.setExport('env', env); }, { context });
  function moduleFor(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const module = new vm.SourceTextModule(source, { context, identifier: filename });
    modules.set(filename, module);
    return module;
  }
  async function route(relative) {
    const module = moduleFor(path.join(root, relative));
    await module.link((specifier, parent) => {
      if (specifier === 'cloudflare:workers') return runtime;
      const filename = specifier.startsWith('@/')
        ? path.join(root, specifier.slice(2))
        : path.resolve(path.dirname(parent.identifier), specifier);
      return moduleFor(`${filename}.ts`);
    });
    await module.evaluate();
    return module.namespace;
  }
  const portrait = await route('app/api/portrait/route.ts');
  const exported = await route('app/api/account/export/route.ts');
  const billing = await route('app/api/billing/status/route.ts');
  const checkout = await route('app/api/billing/checkout/route.ts');
  const portal = await route('app/api/billing/portal/route.ts');
  const account = await route('app/api/account/route.ts');
  const health = await route('app/api/health/route.ts');
  function request(token, method = 'GET', body, suffix = '') {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    return new Request(`https://holyarted.example.test/api/portrait${suffix}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  return { db, env, faults, logs, portrait, exported, billing, checkout, portal, account, health, request };
}

test('health check reports only availability and never configuration details', async (t) => {
  const f = await fixture(t);
  const response = await f.health.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  f.faults.database = true;
  const failed = await f.health.GET();
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { status: 'unavailable' });
  assert.equal(f.logs.join('\n'), 'health_check_failed');
});

test('anonymous and invalid sessions cannot read, save, delete, or export data', async (t) => {
  const f = await fixture(t);
  for (const token of [null, 'invalid']) {
    for (const [handler, method, body] of [
      [f.portrait.GET, 'GET'], [f.portrait.PUT, 'PUT', input],
      [f.portrait.DELETE, 'DELETE'], [f.exported.GET, 'GET'], [f.billing.GET, 'GET'],
      [f.checkout.POST, 'POST', { plan: 'plus' }], [f.portal.POST, 'POST'],
    ]) {
      const response = await handler(f.request(token, method, body));
      assert.equal(response.status, 401);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM portraits').get().count, 0);
});

test('save, reopen, export, and delete remain isolated between two users', async (t) => {
  const f = await fixture(t);
  const aliceSave = await f.portrait.PUT(f.request('alice', 'PUT', {
    ...input, userId: people.bob.id, profile: { fullName: 'Forged profile' },
  }));
  assert.equal(aliceSave.status, 200);
  const saved = (await aliceSave.json()).portrait;
  assert.equal(saved.profile.fullName, 'Ada Yılmaz');
  assert.equal((await (await f.portrait.GET(f.request('bob'))).json()).portrait, null);
  assert.equal((await f.portrait.PUT(f.request('bob', 'PUT', { ...input, firstName: 'Bob', lastName: 'Test' }))).status, 200);

  // A fresh request, as after reauthentication, reads the persisted portrait.
  const reopened = await f.portrait.GET(f.request('alice', 'GET', undefined, '?userId=test-bob'));
  assert.deepEqual((await reopened.json()).portrait, saved);
  const exported = await f.exported.GET(f.request('alice'));
  assert.equal(exported.status, 200);
  assert.match(exported.headers.get('content-disposition'), /attachment/);
  assert.equal(exported.headers.get('cache-control'), 'no-store');
  const data = await exported.json();
  assert.equal(data.account.id, people.alice.id);
  assert.deepEqual(data.portrait, saved);
  assert.equal(data.membership.plan, 'basic');
  assert.ok(!JSON.stringify(data).includes(people.bob.email));

  const deleted = await f.portrait.DELETE(f.request('alice', 'DELETE', { userId: people.bob.id }));
  assert.equal(deleted.status, 204);
  assert.equal(deleted.headers.get('cache-control'), 'no-store');
  assert.equal(deleted.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await (await f.portrait.GET(f.request('alice'))).json()).portrait, null);
  assert.equal((await (await f.portrait.GET(f.request('bob'))).json()).portrait.profile.fullName, 'Bob Test');
  assert.equal((await (await f.exported.GET(f.request('alice'))).json()).portrait, null);
  assert.equal((await f.portrait.DELETE(f.request('alice', 'DELETE'))).status, 204);
});

test('invalid replacement requests do not overwrite a saved portrait', async (t) => {
  const f = await fixture(t);
  await f.portrait.PUT(f.request('alice', 'PUT', input));
  for (const body of [null, {}, { ...input, birthDate: '1990-02-31' }, { ...input, firstName: 'A'.repeat(81) }]) {
    assert.equal((await f.portrait.PUT(f.request('alice', 'PUT', body))).status, 400);
  }
  assert.equal((await f.portrait.PUT(f.request('alice', 'PUT', { ...input, firstName: 'A'.repeat(5000) }))).status, 413);
  const reopened = await (await f.portrait.GET(f.request('alice'))).json();
  assert.equal(reopened.portrait.firstName, input.firstName);
});

test('membership and export use the authenticated user and omit billing identifiers', async (t) => {
  const f = await fixture(t);
  f.db.prepare(`INSERT INTO memberships (user_id,email,plan,status,stripe_customer_id,stripe_subscription_id,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(people.alice.id, people.alice.email, 'premium', 'active', 'cus_private', 'sub_private', '2026-09-25');
  assert.equal((await (await f.billing.GET(f.request('alice'))).json()).plan, 'premium');
  assert.equal((await (await f.billing.GET(f.request('bob'))).json()).plan, 'basic');
  const exported = await (await f.exported.GET(f.request('alice'))).json();
  assert.equal(exported.membership.plan, 'premium');
  assert.ok(!JSON.stringify(exported).includes('cus_private'));
  assert.ok(!JSON.stringify(exported).includes('sub_private'));
  f.db.prepare('UPDATE memberships SET status = ? WHERE user_id = ?').run('canceled', people.alice.id);
  assert.equal((await (await f.billing.GET(f.request('alice'))).json()).plan, 'basic');
});

test('upstream failures fail closed and do not leak private data in responses or logs', async (t) => {
  const f = await fixture(t);
  for (const failure of ['database', 'auth']) {
    f.faults[failure] = true;
    for (const [handler, method, body] of [
      [f.portrait.GET, 'GET'], [f.portrait.PUT, 'PUT', input],
      [f.portrait.DELETE, 'DELETE'], [f.exported.GET, 'GET'], [f.billing.GET, 'GET'],
      [f.checkout.POST, 'POST', { plan: 'plus' }], [f.portal.POST, 'POST'],
    ]) {
      const response = await handler(f.request('alice', method, body));
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.doesNotMatch(await response.text(), /alice@example.test|1990-01-05|private-test-token/);
    }
    f.faults[failure] = false;
  }
  assert.equal(f.logs.length, 14);
  assert.doesNotMatch(f.logs.join('\n'), /alice@example.test|1990-01-05|private-test-token/);
});

test('full account deletion fails closed until the server-only admin key is configured', async (t) => {
  const f = await fixture(t);
  await f.portrait.PUT(f.request('alice', 'PUT', input));
  const response = await f.account.DELETE(f.request('alice', 'DELETE'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await (await f.portrait.GET(f.request('alice'))).json()).portrait.firstName, input.firstName);
});
