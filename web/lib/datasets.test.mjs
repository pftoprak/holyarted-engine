// The Turkish reading texts are the founder's data and must not change
// (founder decision, 5 Nov 2026: translations live separately in data/en/).
// This fails if any Turkish file differs by a single character. If the
// founder approves a change, update the hash here in the same commit.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const TURKISH = {
  'abilities.json': 'cd6cc4630c41cdd12162c59ec57a8b19797cb761c66e6fd0278f3b1db78e810b',
  'ideal_job.json': 'd22ee3f97d1426682df06a5a23a03cb98b9d26d47d02e8a5e504d186e2610658',
  'life_path.json': '020506cc7ff7161cd99d3b44971f361dbef00341bdee6b7903bf8e72296f60ba',
  'showcase.json': 'e426696203e3fc4234e5b9decbbf6d0a58513289d189962cb06af98453ceeda4',
};

// Line endings depend on the checkout (Windows or CI); content does not.
const hashOf = (url) => createHash('sha256').update(readFileSync(url, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
const paragraphCount = (text) => text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).length;

test('the Turkish reading texts are unchanged, in web/data and in data/', () => {
  for (const [file, hash] of Object.entries(TURKISH)) {
    assert.equal(hashOf(new URL(`../data/${file}`, import.meta.url)), hash, `web/data/${file} changed`);
    assert.equal(hashOf(new URL(`../../data/${file}`, import.meta.url)), hash, `data/${file} changed`);
  }
});

test('every English translation matches its Turkish text key by key and paragraph by paragraph', () => {
  let translated = 0;
  for (const file of Object.keys(TURKISH)) {
    const englishUrl = new URL(`../data/en/${file}`, import.meta.url);
    if (!existsSync(englishUrl)) continue;
    const turkish = JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
    const english = JSON.parse(readFileSync(englishUrl, 'utf8'));
    assert.deepEqual(Object.keys(english).sort(), Object.keys(turkish).sort(), `${file}: keys differ`);
    for (const [key, text] of Object.entries(english)) {
      assert.ok(typeof text === 'string' && text.trim(), `${file} ${key}: empty`);
      assert.equal(paragraphCount(text), paragraphCount(turkish[key]), `${file} ${key}: paragraph count differs`);
      assert.doesNotMatch(text, /[ğışçöüĞİŞÇÖÜ]/, `${file} ${key}: Turkish letters left in the English text`);
      translated += 1;
    }
  }
  assert.ok(translated >= 13);
});
