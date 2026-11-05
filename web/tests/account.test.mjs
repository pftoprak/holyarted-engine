import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash, createHmac } from 'node:crypto';
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
async function fixture(t, { accounts = true } = {}) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  for (const file of readdirSync(path.join(root, 'drizzle')).filter((name) => name.endsWith('.sql')).sort()) {
    db.exec(readFileSync(path.join(root, 'drizzle', file), 'utf8').replaceAll('--> statement-breakpoint', ''));
  }
  const faults = { database: false, auth: false, stripe: false, admin: false };
  const calls = [];
  const deletedUsers = new Set();
  const subscriptions = {};
  const iyzico = {};
  const alerts = [];
  const logs = [];
  const network = { requests: 0, queries: 0 };
  const env = {
    HOLYARTED_ACCOUNTS_ENABLED: accounts ? 'true' : 'false',
    // The Stripe tests below run with Stripe; iyzico tests switch this.
    BILLING_PROVIDER: 'stripe',
    SUPABASE_URL: 'https://auth.example.test',
    SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
    DB: {
      prepare(sql) {
        network.queries += 1;
        if (faults.database) throw new Error('database failed: alice@example.test 1990-01-05');
        return {
          bind(...values) {
            return {
              async first() { return db.prepare(sql).get(...values) ?? null; },
              async run() { db.prepare(sql).run(...values); return { success: true }; },
              async all() { return { results: db.prepare(sql).all(...values) }; },
            };
          },
        };
      },
    },
  };
  const context = vm.createContext({
    Request, Response, Headers, AbortSignal, TextEncoder, TextDecoder, Uint8Array, btoa, crypto, Math, Array, Date, URL,
    console: { error: (...args) => logs.push(args.map(String).join(' ')) },
    fetch: async (url, init) => {
      network.requests += 1;
      if (url.startsWith('https://sandbox-api.iyzipay.com/')) {
        const path = new URL(url).pathname;
        // Every call must carry a valid IYZWSv2 signature over randomKey + path + body.
        const decoded = Buffer.from(init.headers.authorization.replace(/^IYZWSv2 /, ''), 'base64').toString();
        const [, apiKey, randomKey, signature] = decoded.match(/^apiKey:(.*)&randomKey:(.*)&signature:(.*)$/);
        assert.equal(apiKey, 'iyzico-api-key');
        assert.equal(init.headers['x-iyzi-rnd'], randomKey);
        assert.equal(signature, createHmac('sha256', 'iyzico-secret-key').update(randomKey + path + (init.body ?? '')).digest('hex'));
        calls.push(`iyzico ${init.method} ${path}`);
        const ref = decodeURIComponent(path.split('/')[4]);
        if (path.endsWith('/cancel')) {
          if (faults.iyzicoCancel) return Response.json({ status: 'failure', errorCode: 'xx', errorMessage: 'private detail' }, { status: 422 });
          if (iyzico[ref]) iyzico[ref].subscriptionStatus = 'CANCELED';
          return Response.json({ status: 'success' });
        }
        return iyzico[ref]
          ? Response.json({ status: 'success', data: { items: [iyzico[ref]] } })
          : Response.json({ status: 'failure', errorCode: '404' }, { status: 404 });
      }
      if (url === 'https://alerts.example.test/hook') {
        alerts.push(JSON.parse(init.body));
        return new Response(null, { status: 204 });
      }
      if (url.startsWith('https://api.stripe.com/v1/subscriptions/') && init.method === 'GET') {
        calls.push('stripe-read');
        const subscription = subscriptions[decodeURIComponent(url.split('/').at(-1))];
        return Response.json(subscription ?? { error: { code: 'resource_missing' } }, { status: subscription ? 200 : 404 });
      }
      if (url.startsWith('https://api.stripe.com/v1/subscriptions/')) {
        calls.push('stripe');
        assert.equal(init.method, 'DELETE');
        assert.equal(init.headers['stripe-version'], '2024-06-20');
        if (faults.stripe === 'missing') return Response.json({ error: { code: 'resource_missing', message: 'No such subscription' } }, { status: 404 });
        assert.equal(init.headers.authorization, `Basic ${btoa('test-stripe-key:')}`);
        return Response.json(faults.stripe ? { error: { message: 'private billing error' } } : { status: 'canceled' }, { status: faults.stripe ? 503 : 200 });
      }
      if (url.startsWith('https://auth.example.test/auth/v1/admin/users/')) {
        calls.push('admin');
        assert.equal(init.method, 'DELETE');
        assert.equal(init.headers.apikey, 'test-admin-key');
        assert.equal(init.headers.authorization, 'Bearer test-admin-key');
        if (faults.admin) return Response.json({}, { status: 503 });
        deletedUsers.add(decodeURIComponent(url.split('/').at(-1)));
        return Response.json({});
      }
      assert.equal(url, 'https://auth.example.test/auth/v1/user');
      assert.equal(init.headers.apikey, 'test-public-key');
      if (faults.auth) throw new Error('auth failed: Bearer private-test-token');
      const token = init.headers.authorization?.replace(/^Bearer /, '');
      return people[token] && !deletedUsers.has(people[token].id) ? Response.json(people[token]) : Response.json({}, { status: 401 });
    },
  });
  const modules = new Map();
  const runtime = new vm.SyntheticModule(['env'], function () { this.setExport('env', env); }, { context });
  function moduleFor(filename) {
    if (modules.has(filename)) return modules.get(filename);
    if (filename.endsWith('.json')) {
      const data = JSON.parse(readFileSync(filename, 'utf8'));
      const json = new vm.SyntheticModule(['default'], function () { this.setExport('default', data); }, { context });
      modules.set(filename, json);
      return json;
    }
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const created = new vm.SourceTextModule(source, { context, identifier: filename });
    modules.set(filename, created);
    return created;
  }
  async function route(relative) {
    const loaded = moduleFor(path.join(root, relative));
    // Already loaded as a dependency of a route: reuse that instance.
    if (loaded.status === 'evaluated') return loaded.namespace;
    await loaded.link((specifier, parent) => {
      if (specifier === 'cloudflare:workers') return runtime;
      const filename = specifier.startsWith('@/')
        ? path.join(root, specifier.slice(2))
        : path.resolve(path.dirname(parent.identifier), specifier);
      if (filename.endsWith('.json')) return moduleFor(filename);
      return moduleFor(existsSync(`${filename}.ts`) ? `${filename}.ts` : path.join(filename, 'index.ts'));
    });
    await loaded.evaluate();
    return loaded.namespace;
  }
  const portrait = await route('app/api/portrait/route.ts');
  const exported = await route('app/api/account/export/route.ts');
  const billing = await route('app/api/billing/status/route.ts');
  const checkout = await route('app/api/billing/checkout/route.ts');
  const portal = await route('app/api/billing/portal/route.ts');
  const account = await route('app/api/account/route.ts');
  const health = await route('app/api/health/route.ts');
  const reading = await route('app/api/reading/route.ts');
  const webhook = await route('app/api/billing/webhook/route.ts');
  const admin = await route('app/api/admin/grants/route.ts');
  function request(token, method = 'GET', body, suffix = '') {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    return new Request(`https://holyarted.example.test/api/portrait${suffix}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  return { db, env, faults, logs, calls, network, deletedUsers, subscriptions, route, alerts, admin, iyzico, portrait, exported, billing, checkout, portal, account, health, reading, webhook, request };
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
      [f.account.DELETE, 'DELETE'],
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
  // During the database outage the rate limit falls back to memory and says so once per request.
  assert.equal(f.logs.filter((line) => line === 'rate_limit_store_failed').length, 6);
  assert.equal(f.logs.length, 20);
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

async function deletionFixture(t, subscription = 'sub_test') {
  const f = await fixture(t);
  f.env.SUPABASE_SERVICE_ROLE_KEY = 'test-admin-key';
  f.env.STRIPE_SECRET_KEY = 'test-stripe-key';
  await f.portrait.PUT(f.request('alice', 'PUT', input));
  await f.portrait.PUT(f.request('bob', 'PUT', { ...input, firstName: 'Bob' }));
  f.db.prepare(`INSERT INTO memberships (user_id,email,plan,status,stripe_customer_id,stripe_subscription_id,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(people.alice.id, people.alice.email, 'premium', 'active', 'cus_test', subscription, '2026-09-28');
  return f;
}

test('full deletion cancels billing, deletes only the authenticated user, and rejects their old session', async (t) => {
  const f = await deletionFixture(t);
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE', { userId: people.bob.id }))).status, 204);
  assert.deepEqual(f.calls, ['stripe', 'admin']);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM memberships').get().count, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM portraits WHERE user_id = ?').get(people.alice.id).count, 0);
  assert.equal((await f.exported.GET(f.request('alice'))).status, 401);
  assert.equal((await (await f.portrait.GET(f.request('bob'))).json()).portrait.firstName, 'Bob');
});

test('billing cancellation failure preserves account data and does not call admin deletion', async (t) => {
  const f = await deletionFixture(t);
  f.faults.stripe = true;
  const result = await f.account.DELETE(f.request('alice', 'DELETE'));
  assert.equal(result.status, 503);
  assert.deepEqual(f.calls, ['stripe']);
  assert.equal((await (await f.portrait.GET(f.request('alice'))).json()).portrait.firstName, input.firstName);
  assert.equal((await (await f.billing.GET(f.request('alice'))).json()).plan, 'premium');
  assert.doesNotMatch(await result.text(), /private billing|test-admin-key|test-stripe-key/);
  assert.deepEqual(f.logs, ['account_delete_failed']);
});

test('active paid membership without a subscription reference blocks deletion', async (t) => {
  const f = await deletionFixture(t, null);
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 503);
  assert.deepEqual(f.calls, []);
  assert.equal((await (await f.portrait.GET(f.request('alice'))).json()).portrait.firstName, input.firstName);
});

test('provider deletion failure reports failure and a retry can finish deleting the user', async (t) => {
  const f = await deletionFixture(t);
  f.faults.admin = true;
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 503);
  assert.equal(f.deletedUsers.size, 0);
  f.faults.admin = false;
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 204);
  assert.deepEqual(f.calls, ['stripe', 'admin', 'admin']);
  assert.equal((await f.exported.GET(f.request('alice'))).status, 401);
});

test('export rate limit blocks excess requests without blocking another user', async (t) => {
  const f = await fixture(t);
  for (let index = 0; index < 20; index++) {
    assert.equal((await f.exported.GET(f.request('alice'))).status, 200);
  }
  const limited = await f.exported.GET(f.request('alice'));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.equal(limited.headers.get('cache-control'), 'no-store');
  assert.equal((await f.exported.GET(f.request('bob'))).status, 200);
});

test('with accounts disabled, account and billing routes return 404 without touching auth, D1 or Stripe', async (t) => {
  const f = await fixture(t, { accounts: false });
  for (const token of [null, 'alice']) {
    for (const [handler, method, body] of [
      [f.portrait.GET, 'GET'], [f.portrait.PUT, 'PUT', input],
      [f.portrait.DELETE, 'DELETE'], [f.exported.GET, 'GET'], [f.billing.GET, 'GET'],
      [f.checkout.POST, 'POST', { plan: 'plus' }], [f.portal.POST, 'POST'],
      [f.account.DELETE, 'DELETE'], [f.webhook.POST, 'POST', {}],
    ]) {
      const response = await handler(f.request(token, method, body));
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
  assert.deepEqual(f.network, { requests: 0, queries: 0 });
  const health = await f.health.GET();
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
});

test('in local open mode the detailed reading returns every dataset text and stores nothing', async (t) => {
  const f = await fixture(t, { accounts: false });
  const response = await f.reading.POST(f.request(null, 'POST', input));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { reading } = await response.json();
  assert.equal(reading.locale, 'tr');
  assert.deepEqual(reading.sections.map((section) => [section.id, section.tier]), [['showcase', 'basic'], ['abilities', 'plus'], ['lifePath', 'plus'], ['idealJob', 'premium']]);
  // App-written labels come in both interface languages; dataset texts stay Turkish.
  assert.deepEqual(reading.sections[0].reason, { en: 'Your day of birth is 5.', tr: 'Doğum günün 5.' });
  assert.deepEqual(reading.sections[1].reason, { en: 'The vowels in your name (A, E, I, O, U) add up to 12, which reduces to 3.', tr: 'Adındaki sesli harflerin (A, E, I, O, U) toplamı 12; bu 3 sayısına indirgeniyor.' });
  assert.deepEqual(reading.sections[3].title, { en: 'Areas to deepen', tr: 'Derinleşme alanların' });
  assert.match(reading.sections[2].note.tr, /tespit değildir/);
  assert.match(reading.sections[2].note.en, /not a finding/);
  // English translations sit next to the Turkish text.
  const abilitiesEn = JSON.parse(readFileSync(path.join(root, 'data', 'en', 'abilities.json'), 'utf8'));
  assert.equal(reading.sections[1].paragraphsEn.join(' ').replace(/\s+/g, ' '), abilitiesEn[reading.sections[1].key].replace(/\s+/g, ' '));
  assert.equal(reading.sections[1].paragraphsEn.length, reading.sections[1].paragraphs.length);
  // Life path is not translated yet.
  assert.equal(reading.sections[2].paragraphsEn, null);
  assert.equal(reading.locale, 'tr');
  for (const section of reading.sections) assert.equal(section.status, 'ready');
  const showcase = JSON.parse(readFileSync(path.join(root, 'data', 'showcase.json'), 'utf8'));
  assert.equal(reading.sections[0].key, '5');
  assert.ok(showcase['5'].includes(reading.sections[0].paragraphs[0]));
  for (const section of reading.sections) assert.ok(section.paragraphs.length > 0);
  for (const body of [null, {}, { ...input, birthDate: '1990-02-31' }, { ...input, birthDate: '2999-01-01' }, { ...input, firstName: 'A'.repeat(81) }]) {
    assert.equal((await f.reading.POST(f.request(null, 'POST', body))).status, 400);
  }
  assert.equal((await f.reading.POST(f.request(null, 'POST', { ...input, firstName: 'A'.repeat(5000) }))).status, 413);
  assert.deepEqual(f.network, { requests: 0, queries: 0 });
  assert.deepEqual(f.logs, []);
});

test('detailed reading never shows placeholder or missing texts and quotes relationship lines verbatim', async (t) => {
  const f = await fixture(t, { accounts: false });
  const read = async (body) => (await (await f.reading.POST(f.request(null, 'POST', body))).json()).reading;
  const data = (name) => JSON.parse(readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'));

  // Name total 33: ideal_job["33"] is "n/a" in the dataset.
  const placeholder = await read({ firstName: 'Barış', lastName: 'Kaya', birthDate: '1995-03-03' });
  const job = placeholder.sections.find((section) => section.id === 'idealJob');
  assert.deepEqual([job.key, job.status, job.paragraphs], ['33', 'pending', []]);
  assert.ok(!JSON.stringify(placeholder).includes('n/a'));
  // No A, E, I, O, U: vowel total 0 has no dataset row.
  const noVowels = await read({ firstName: 'Lyn', lastName: 'Sky', birthDate: '1991-04-14' });
  const skills = noVowels.sections.find((section) => section.id === 'abilities');
  assert.deepEqual([skills.key, skills.status], ['0', 'pending']);
  assert.deepEqual(f.logs, ['reading_section_unavailable idealJob:33', 'reading_section_unavailable abilities:0']);

  // Age framing changes only the heading, never the text.
  const young = await read({ firstName: 'Ece Su', lastName: 'Kaya', birthDate: '2008-03-11' });
  const youngJob = young.sections.find((section) => section.id === 'idealJob');
  assert.deepEqual(youngJob.title, { en: 'Directions you lean toward', tr: 'Yöneldiğin alanlar' });
  assert.equal(youngJob.paragraphs.join(' ').replace(/\s+/g, ' '), data('ideal_job')[youngJob.key].trim().replace(/\s+/g, ' '));

  // "İlişkide sen" lines are sentences that exist unchanged in the person's own sections.
  assert.ok(young.relationships.length > 0);
  for (const line of young.relationships) {
    const section = young.sections.find((candidate) => candidate.id === line.sectionId);
    assert.ok(section.paragraphs.join(' ').replace(/\s+/g, ' ').includes(line.sentence));
    assert.notEqual(line.sectionId, 'idealJob');
  }
  assert.ok(young.relationships.filter((line) => line.sectionId === 'showcase').length <= 2);
});

test('reading and portrait chapters are filtered on the server by the signed-in plan', async (t) => {
  const f = await fixture(t);
  const membership = (plan, status = 'active') => f.db.prepare(`INSERT INTO memberships (user_id,email,plan,status,stripe_customer_id,stripe_subscription_id,updated_at)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = excluded.status`)
    .run(people.alice.id, people.alice.email, plan, status, 'cus_private', 'sub_private', '2026-11-03');
  const served = async (token) => {
    const response = await f.reading.POST(f.request(token, 'POST', input));
    assert.equal(response.status, 200);
    return response.json();
  };
  const status = (body) => Object.fromEntries(body.reading.sections.map((section) => [section.id, section.status]));
  const texts = (body) => [
    ...body.reading.sections.flatMap((section) => [...section.paragraphs, ...(section.paragraphsEn ?? [])]),
    ...body.reading.relationships.map((line) => line.sentence),
    ...['en', 'tr'].flatMap((locale) => [...body.chapters[locale].cards, ...body.chapters[locale].lenses].flat()),
  ];

  membership('premium');
  const premium = await served('alice');
  assert.equal(premium.plan, 'premium');
  assert.deepEqual(status(premium), { showcase: 'ready', abilities: 'ready', lifePath: 'ready', idealJob: 'ready' });
  for (const locale of ['en', 'tr']) {
    assert.equal(premium.chapters[locale].cards.length, 4);
    assert.equal(premium.chapters[locale].lenses.length, 2);
  }
  assert.equal(premium.reading.relationshipsLocked, false);

  // Anonymous and invalid sessions are Basic: no paid text appears anywhere in the response.
  for (const token of [null, 'invalid', 'bob']) {
    const basic = await served(token);
    assert.equal(basic.plan, 'basic');
    assert.deepEqual(status(basic), { showcase: 'ready', abilities: 'locked', lifePath: 'locked', idealJob: 'locked' });
    for (const section of basic.reading.sections.filter((candidate) => candidate.status === 'locked')) assert.deepEqual([section.paragraphs, section.paragraphsEn], [[], null]);
    assert.deepEqual([basic.reading.relationships, basic.reading.relationshipsLocked], [[], true]);
    for (const locale of ['en', 'tr']) {
      assert.deepEqual(basic.chapters[locale].cards, premium.chapters[locale].cards.slice(0, 2));
      assert.deepEqual(basic.chapters[locale].lenses, []);
    }
    const json = JSON.stringify(basic);
    // Relationship lines quote open sections too, so compare with the open text as a whole.
    const open = texts(basic).join(' ').replace(/s+/g, ' ');
    const paid = texts(premium).filter((text) => !open.includes(text.replace(/s+/g, ' ')));
    assert.ok(paid.length > 0);
    for (const text of paid) assert.ok(!json.includes(text), text.slice(0, 40));
  }

  membership('plus');
  const plus = await served('alice');
  assert.equal(plus.plan, 'plus');
  assert.deepEqual(status(plus), { showcase: 'ready', abilities: 'ready', lifePath: 'ready', idealJob: 'locked' });
  assert.equal(plus.chapters.tr.cards.length, 4);
  assert.deepEqual(plus.chapters.tr.lenses, []);
  assert.equal(plus.reading.relationshipsLocked, false);
  for (const line of plus.reading.relationships) assert.notEqual(line.sectionId, 'idealJob');
  assert.ok(!JSON.stringify(plus).includes(premium.reading.sections[3].paragraphs[0]));

  // A canceled paid membership falls back to Basic.
  membership('premium', 'canceled');
  assert.equal((await served('alice')).plan, 'basic');
  // Accounts are on unless the flag is exactly "false", so a missing value never opens paid content.
  for (const value of [undefined, '', 'FALSE ', 'no']) {
    f.env.HOLYARTED_ACCOUNTS_ENABLED = value;
    assert.equal((await served(null)).plan, 'basic');
  }
  assert.deepEqual(f.logs, []);
});

test('reading fails closed when the plan cannot be checked', async (t) => {
  const f = await fixture(t);
  f.faults.auth = true;
  const response = await f.reading.POST(f.request('alice', 'POST', input));
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.deepEqual(JSON.parse(body), { error: 'Your reading could not be opened.' });
  assert.deepEqual(f.logs, ['reading_plan_unavailable']);
  f.faults.auth = false;
  f.faults.database = true;
  assert.equal((await f.reading.POST(f.request('alice', 'POST', input))).status, 503);
});

function stripeWebhook(event, secret = 'whsec_test') {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return new Request('https://holyarted.example.test/api/billing/webhook', {
    method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${signature}` }, body,
  });
}

test('billing webhook takes the plan from the billed price, ignores stale and repeated events', async (t) => {
  const f = await fixture(t);
  Object.assign(f.env, { STRIPE_WEBHOOK_SECRET: 'whsec_test', STRIPE_SECRET_KEY: 'test-stripe-key', STRIPE_PLUS_PRICE_ID: 'price_plus', STRIPE_PREMIUM_PRICE_ID: 'price_premium' });
  const row = (userId) => f.db.prepare('SELECT plan, status, current_period_end, billing_event_at FROM memberships WHERE user_id = ?').get(userId);
  const checkout = (id, created, userId, email, subscription) => ({
    id, created, type: 'checkout.session.completed',
    data: { object: { client_reference_id: userId, subscription, customer: 'cus_1', customer_details: { email }, metadata: { plan: 'plus' } } },
  });
  // Metadata says Plus, but the billed price is Premium; the newer API keeps the period end on the item.
  f.subscriptions.sub_1 = { id: 'sub_1', customer: 'cus_1', status: 'active', metadata: { plan: 'plus' }, items: { data: [{ price: { id: 'price_premium' }, current_period_end: 1800000000 }] } };

  assert.equal((await f.webhook.POST(stripeWebhook(checkout('evt_1', 100, people.alice.id, people.alice.email, 'sub_1'), 'wrong'))).status, 400);
  assert.equal((await f.webhook.POST(stripeWebhook(checkout('evt_1', 100, people.alice.id, people.alice.email, 'sub_1')))).status, 200);
  assert.deepEqual({ ...row(people.alice.id) }, { plan: 'premium', status: 'active', current_period_end: 1800000000, billing_event_at: 100 });

  // A repeated delivery is acknowledged without being applied again.
  assert.equal((await f.webhook.POST(stripeWebhook(checkout('evt_1', 100, people.alice.id, people.alice.email, 'sub_1')))).status, 200);
  assert.deepEqual(f.calls, ['stripe-read']);

  const subscriptionEvent = (id, created, type, status) => ({
    id, created, type, data: { object: { ...f.subscriptions.sub_1, status, current_period_end: 1700000000 } },
  });
  await f.webhook.POST(stripeWebhook(subscriptionEvent('evt_3', 300, 'customer.subscription.deleted', 'canceled')));
  assert.equal(row(people.alice.id).status, 'canceled');
  // Delivered late: an older "active" update must not revive a canceled subscription.
  await f.webhook.POST(stripeWebhook(subscriptionEvent('evt_2', 200, 'customer.subscription.updated', 'active')));
  assert.deepEqual([row(people.alice.id).status, row(people.alice.id).billing_event_at], ['canceled', 300]);
  assert.equal((await (await f.billing.GET(f.request('alice'))).json()).plan, 'basic');

  // An unknown price grants nothing; a session without a subscription writes nothing.
  f.subscriptions.sub_2 = { id: 'sub_2', customer: 'cus_2', status: 'active', current_period_end: 1800000000, items: { data: [{ price: { id: 'price_other' } }] } };
  await f.webhook.POST(stripeWebhook({ ...checkout('evt_4', 400, people.bob.id, people.bob.email, 'sub_2'), data: { object: { client_reference_id: people.bob.id, subscription: 'sub_2', customer: 'cus_2', customer_details: { email: people.bob.email } } } }));
  assert.equal(row(people.bob.id).plan, 'basic');
  await f.webhook.POST(stripeWebhook(checkout('evt_5', 500, 'test-carol', 'carol@example.test', null)));
  assert.equal(row('test-carol'), undefined);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM stripe_events').get().count, 5);
  assert.deepEqual(f.logs, ['billing_unknown_price']);
});

test('an interrupted account deletion resumes without charging or cancelling twice', async (t) => {
  const f = await deletionFixture(t);
  // An earlier attempt stopped billing, then failed before removing data.
  f.db.prepare('INSERT INTO account_deletions (user_id, requested_at, billing_canceled, attempts, last_attempt_at) VALUES (?, ?, 1, 1, ?)')
    .run(people.alice.id, '2026-11-03T10:00:00Z', '2026-11-03T10:00:00Z');
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 204);
  assert.deepEqual(f.calls, ['admin']);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM account_deletions').get().count, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM memberships').get().count, 0);
});

test('a subscription already removed in Stripe does not block account deletion', async (t) => {
  const f = await deletionFixture(t);
  f.faults.stripe = 'missing';
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 204);
  assert.deepEqual(f.calls, ['stripe', 'admin']);
});

test('a failed deletion stays recorded so it can be found and resumed', async (t) => {
  const f = await deletionFixture(t);
  f.faults.admin = true;
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 503);
  assert.deepEqual({ ...f.db.prepare('SELECT billing_canceled, attempts FROM account_deletions WHERE user_id = ?').get(people.alice.id) }, { billing_canceled: 1, attempts: 1 });
});

test('rate limits are counted in the shared database under hashed keys', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.exported.GET(f.request('alice'))).status, 200);
  const keys = f.db.prepare('SELECT key FROM rate_limits').all().map((entry) => entry.key);
  assert.equal(keys.length, 1);
  assert.match(keys[0], /^[0-9a-f]{64}$/);
  assert.equal(keys[0], createHash('sha256').update(`account-export:${people.alice.id}:local-client`).digest('hex'));
  // Another server instance has already used up this window: the limit applies here too.
  f.db.prepare('UPDATE rate_limits SET count = 20').run();
  assert.equal((await f.exported.GET(f.request('alice'))).status, 429);
});

test('membership rules do not depend on the payment provider', async (t) => {
  const f = await fixture(t);
  const { applyBillingEvent } = await f.route('lib/billing/apply-event.ts');
  // Any provider that reports subscriptions in the shared shape gets the same
  // ordering, deduplication and plan rules as Stripe.
  const live = { id: 'other_sub_1', customerId: 'other_cus_1', status: 'active', plan: 'plus', periodEnd: 1800000000 };
  const provider = { name: 'other', getSubscription: async () => live };
  const row = () => ({ ...f.db.prepare('SELECT plan, status, stripe_customer_id, billing_event_at FROM memberships WHERE user_id = ?').get(people.alice.id) });

  await applyBillingEvent(provider, { kind: 'checkout_completed', id: 'o1', created: 10, userId: people.alice.id, email: people.alice.email, subscriptionId: 'other_sub_1' });
  assert.deepEqual(row(), { plan: 'plus', status: 'active', stripe_customer_id: 'other_cus_1', billing_event_at: 10 });
  await applyBillingEvent(provider, { kind: 'subscription_deleted', id: 'o3', created: 30, subscription: { ...live, status: 'canceled' } });
  await applyBillingEvent(provider, { kind: 'subscription_changed', id: 'o2', created: 20, subscription: { ...live, plan: 'premium' } });
  assert.deepEqual([row().status, row().plan], ['canceled', 'plus']);
  await applyBillingEvent(provider, { kind: 'ignored', id: 'o4', created: 40 });
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM stripe_events').get().count, 4);
});

test('server failures alert a webhook once, without personal data', async (t) => {
  const f = await fixture(t);
  f.env.ERROR_REPORT_URL = 'https://alerts.example.test/hook';
  f.faults.database = true;
  for (let attempt = 0; attempt < 3; attempt++) assert.equal((await f.portrait.GET(f.request('alice'))).status, 503);
  // One alert per distinct event despite three failing requests.
  assert.deepEqual(f.alerts.map((alert) => alert.event).sort((a, b) => a.localeCompare(b)), ['portrait_load_failed', 'rate_limit_store_failed']);
  for (const alert of f.alerts) {
    assert.equal(alert.text, `[holyarted] ${alert.event}`);
    assert.doesNotMatch(JSON.stringify(alert), /alice|1990-01-05|Bearer|test-/);
  }
});

test('a free-only site without sign-in settings reports healthy without touching the database', async (t) => {
  const f = await fixture(t);
  delete f.env.SUPABASE_URL;
  delete f.env.SUPABASE_PUBLISHABLE_KEY;
  const response = await f.health.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.deepEqual(f.network, { requests: 0, queries: 0 });
  // With sign-in configured, a missing database is still an outage.
  Object.assign(f.env, { SUPABASE_URL: 'https://auth.example.test', SUPABASE_PUBLISHABLE_KEY: 'test-public-key' });
  delete f.env.DB;
  assert.equal((await f.health.GET()).status, 503);
});

const ADMIN = 'test-admin-token-0123456789abcdef0123';
function adminRequest(token, method = 'GET', body) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request('https://holyarted.example.test/api/admin/grants', { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

test('hand-given plans open paid content without payment and never lower a paid plan', async (t) => {
  const f = await fixture(t);
  const plan = async (token) => (await (await f.reading.POST(f.request(token, 'POST', input))).json()).plan;
  const status = async (token) => (await f.billing.GET(f.request(token))).json();

  // The admin route does not exist without a long secret.
  assert.equal((await f.admin.GET(adminRequest(ADMIN))).status, 404);
  f.env.ADMIN_TOKEN = 'too-short';
  assert.equal((await f.admin.GET(adminRequest('too-short'))).status, 404);
  f.env.ADMIN_TOKEN = ADMIN;
  assert.equal((await f.admin.GET(adminRequest(null))).status, 401);
  assert.equal((await f.admin.GET(adminRequest(`${ADMIN}x`))).status, 401);
  for (const body of [{ email: 'not-an-email', plan: 'plus' }, { email: people.alice.email, plan: 'gold' }, { email: people.alice.email, plan: 'plus', days: 0 }]) {
    assert.equal((await f.admin.PUT(adminRequest(ADMIN, 'PUT', body))).status, 400);
  }

  // Given before the first sign-in, matched regardless of letter case.
  assert.equal(await plan('alice'), 'basic');
  const given = await f.admin.PUT(adminRequest(ADMIN, 'PUT', { email: 'ALICE@Example.TEST', plan: 'premium', days: 30, note: 'tester' }));
  assert.equal(given.status, 200);
  assert.equal(await plan('alice'), 'premium');
  assert.equal(await plan('bob'), 'basic');
  assert.deepEqual(await status('alice'), { plan: 'premium', status: 'active', currentPeriodEnd: null, granted: true, grantExpiresAt: (await given.json()).grant.expiresAt });
  const listed = await (await f.admin.GET(adminRequest(ADMIN))).json();
  assert.deepEqual(listed.grants.map((grant) => [grant.email, grant.plan, grant.note]), [[people.alice.email, 'premium', 'tester']]);

  // Expired grants stop counting.
  f.db.prepare('UPDATE membership_grants SET expires_at = ?').run('2020-01-01T00:00:00.000Z');
  assert.equal(await plan('alice'), 'basic');

  // A paid Premium plan stays Premium under a Plus grant, and shows as paid.
  f.db.prepare(`INSERT INTO memberships (user_id,email,plan,status,stripe_customer_id,stripe_subscription_id,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(people.bob.id, people.bob.email, 'premium', 'active', 'cus_bob', 'sub_bob', '2026-11-04');
  await f.admin.PUT(adminRequest(ADMIN, 'PUT', { email: people.bob.email, plan: 'plus' }));
  assert.equal(await plan('bob'), 'premium');
  assert.equal((await status('bob')).granted, false);

  assert.equal((await f.admin.DELETE(adminRequest(ADMIN, 'DELETE', { email: people.bob.email }))).status, 204);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM membership_grants WHERE email = ?').get(people.bob.email).count, 0);
  assert.deepEqual(f.logs.filter((line) => line !== 'admin_auth_failed'), []);
});

test('account deletion also removes a hand-given plan', async (t) => {
  const f = await deletionFixture(t);
  f.env.ADMIN_TOKEN = ADMIN;
  await f.admin.PUT(adminRequest(ADMIN, 'PUT', { email: people.alice.email, plan: 'premium' }));
  assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 204);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM membership_grants').get().count, 0);
});

test('birth dates before 1900 are rejected; there is no age limit', async (t) => {
  const f = await fixture(t);
  const reading = async (birthDate) => (await f.reading.POST(f.request(null, 'POST', { ...input, birthDate }))).status;
  assert.equal(await reading('1899-12-31'), 400);
  assert.equal(await reading('1850-06-15'), 400);
  assert.equal(await reading('1900-01-01'), 200);
  // A person born today is accepted.
  assert.equal(await reading(new Date().toISOString().slice(0, 10)), 200);
  assert.equal((await f.portrait.PUT(f.request('alice', 'PUT', { ...input, birthDate: '1899-12-31' }))).status, 400);
  assert.equal((await f.portrait.PUT(f.request('alice', 'PUT', { ...input, birthDate: '1900-01-01' }))).status, 200);
});

const IYZICO_ENV = {
  BILLING_PROVIDER: 'iyzico', IYZICO_API_KEY: 'iyzico-api-key', IYZICO_SECRET_KEY: 'iyzico-secret-key', IYZICO_MERCHANT_ID: '987654',
  IYZICO_PLUS_PLAN_CODE: 'plan-plus', IYZICO_PREMIUM_PLAN_CODE: 'plan-premium',
};
function iyzicoWebhook(payload, secret = 'iyzico-secret-key') {
  const message = '987654' + secret + payload.iyziEventType + payload.subscriptionReferenceCode + payload.orderReferenceCode + payload.customerReferenceCode;
  const signature = createHmac('sha256', secret).update(message).digest('hex');
  return new Request('https://holyarted.example.test/api/billing/webhook', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-iyz-signature-v3': signature }, body: JSON.stringify(payload),
  });
}

test('iyzico notifications are verified, read the live subscription and follow the membership rules', async (t) => {
  const f = await fixture(t);
  Object.assign(f.env, IYZICO_ENV);
  f.db.prepare(`INSERT INTO memberships (user_id,email,plan,status,stripe_customer_id,stripe_subscription_id,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(people.alice.id, people.alice.email, 'basic', 'incomplete', 'cus-iy', 'sub-iy', '2026-11-04');
  f.iyzico['sub-iy'] = {
    referenceCode: 'sub-iy', customerReferenceCode: 'cus-iy', pricingPlanReferenceCode: 'plan-premium', subscriptionStatus: 'ACTIVE',
    orders: [{ endPeriod: 1800000000000, orderStatus: 'SUCCESS' }, { endPeriod: 1802000000000, orderStatus: 'WAITING' }],
  };
  const event = (type, order, time) => ({ orderReferenceCode: order, customerReferenceCode: 'cus-iy', subscriptionReferenceCode: 'sub-iy', iyziReferenceCode: `ref-${order}`, iyziEventType: type, iyziEventTime: time });
  const row = () => ({ ...f.db.prepare('SELECT plan, status, current_period_end, billing_event_at FROM memberships WHERE user_id = ?').get(people.alice.id) });

  assert.equal((await f.webhook.POST(iyzicoWebhook(event('subscription.order.success', 'o1', 1_700_000_000_000), 'wrong-secret'))).status, 400);
  assert.equal((await f.webhook.POST(iyzicoWebhook(event('subscription.order.success', 'o1', 1_700_000_000_000)))).status, 200);
  assert.deepEqual(row(), { plan: 'premium', status: 'active', current_period_end: 1800000000, billing_event_at: 1700000000 });
  // Delivered twice: applied once.
  await f.webhook.POST(iyzicoWebhook(event('subscription.order.success', 'o1', 1_700_000_000_000)));
  assert.deepEqual(f.calls, ['iyzico GET /v2/subscription/subscriptions/sub-iy']);

  // A failed renewal keeps access during the grace period (UNPAID -> past_due).
  f.iyzico['sub-iy'].subscriptionStatus = 'UNPAID';
  await f.webhook.POST(iyzicoWebhook(event('subscription.order.failure', 'o2', 1_700_100_000_000)));
  assert.equal(row().status, 'past_due');
  assert.equal((await (await f.reading.POST(f.request('alice', 'POST', input))).json()).plan, 'premium');

  // Other event types are acknowledged and ignored.
  assert.equal((await f.webhook.POST(iyzicoWebhook(event('subscription.something.else', 'o3', 1_700_200_000_000)))).status, 200);
  assert.equal(row().status, 'past_due');
  assert.deepEqual(f.logs, []);

  // Keys alone do not open purchases: the checkout page is not built yet.
  const { purchasesAvailable } = await f.route('lib/billing/index.ts');
  assert.equal(purchasesAvailable(true), false);
});

test('account deletion cancels an iyzico subscription, also when it was already canceled there', async (t) => {
  for (const alreadyCanceled of [false, true]) {
    const f = await deletionFixture(t);
    Object.assign(f.env, IYZICO_ENV);
    f.iyzico.sub_test = { referenceCode: 'sub_test', customerReferenceCode: 'cus_test', pricingPlanReferenceCode: 'plan-premium', subscriptionStatus: alreadyCanceled ? 'CANCELED' : 'ACTIVE', orders: [] };
    f.faults.iyzicoCancel = alreadyCanceled;
    assert.equal((await f.account.DELETE(f.request('alice', 'DELETE'))).status, 204);
    assert.deepEqual(f.calls, alreadyCanceled
      ? ['iyzico POST /v2/subscription/subscriptions/sub_test/cancel', 'iyzico GET /v2/subscription/subscriptions/sub_test', 'admin']
      : ['iyzico POST /v2/subscription/subscriptions/sub_test/cancel', 'admin']);
  }
});

test('a failed iyzico cancellation of a live subscription blocks account deletion', async (t) => {
  const f = await deletionFixture(t);
  Object.assign(f.env, IYZICO_ENV);
  f.iyzico.sub_test = { referenceCode: 'sub_test', subscriptionStatus: 'ACTIVE', orders: [] };
  f.faults.iyzicoCancel = true;
  const response = await f.account.DELETE(f.request('alice', 'DELETE'));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private detail/);
  assert.ok(!f.calls.includes('admin'));
});
