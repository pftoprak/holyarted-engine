// Give, list or remove hand-given plans on a running site.
//
//   ADMIN_TOKEN=... node scripts/grant.mjs <site> list
//   ADMIN_TOKEN=... node scripts/grant.mjs <site> give <email> <plus|premium> [days] [note]
//   ADMIN_TOKEN=... node scripts/grant.mjs <site> remove <email>
//
// <site> is the address, e.g. https://holyarted.com. Without days the plan
// does not expire. ADMIN_TOKEN must match the site's ADMIN_TOKEN setting.
const [site, command, email, plan, days, ...note] = process.argv.slice(2);
const token = process.env.ADMIN_TOKEN;

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: ADMIN_TOKEN=... node scripts/grant.mjs <site> list | give <email> <plus|premium> [days] [note] | remove <email>');
  process.exit(1);
}

if (!site || !command) usage();
if (!token) usage('ADMIN_TOKEN is not set.');

const url = new URL('/api/admin/grants', site);
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
let request;
if (command === 'list') request = { method: 'GET', headers };
else if (command === 'give') {
  if (!email || !plan) usage('give needs an email and a plan.');
  const body = { email, plan };
  if (days) body.days = Number(days);
  if (note.length) body.note = note.join(' ');
  request = { method: 'PUT', headers, body: JSON.stringify(body) };
} else if (command === 'remove') {
  if (!email) usage('remove needs an email.');
  request = { method: 'DELETE', headers, body: JSON.stringify({ email }) };
} else usage(`Unknown command: ${command}`);

const response = await fetch(url, request);
const text = await response.text();
if (!response.ok) {
  console.error(`${response.status}: ${text}`);
  process.exit(1);
}
if (command === 'list') {
  const { grants } = JSON.parse(text);
  if (!grants.length) console.log('No grants.');
  for (const grant of grants) console.log(`${grant.email}\t${grant.plan}\t${grant.expiresAt ?? 'no expiry'}\t${grant.note ?? ''}`);
} else if (command === 'give') {
  const { grant } = JSON.parse(text);
  console.log(`${grant.email} now has ${grant.plan}${grant.expiresAt ? ` until ${grant.expiresAt}` : ' with no expiry'}.`);
} else console.log(`Removed the grant for ${email}.`);
