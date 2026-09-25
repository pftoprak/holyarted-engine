import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { calculateCoreProfile, reduceSignal } from './calculation-core.ts';

const rootData = (name) => JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

test('builds stable signals and dataset keys from a name and birth date', () => {
  const profile = calculateCoreProfile('Alex', 'Morgan', '1992-07-16');
  assert.equal(profile.fullName, 'Alex Morgan');
  assert.deepEqual(profile.signals, { dateTotal: 35, dateSignature: 8, birthDay: 16, birthMonth: 7, birthYearTotal: 21, nameTotal: 47, vowelTotal: 13, consonantTotal: 34 });
  assert.deepEqual(profile.contentKeys, { showcase: '7', abilities: '4', idealJob: '11', lifePath: '358' });
  assert.ok(profile.contentKeys.showcase in rootData('showcase'));
  assert.ok(profile.contentKeys.abilities in rootData('abilities'));
  assert.ok(profile.contentKeys.idealJob in rootData('ideal_job'));
  assert.ok(profile.contentKeys.lifePath in rootData('life_path'));
});

test('normalizes Turkish characters consistently', () => {
  const profile = calculateCoreProfile('Ada', 'Yılmaz', '1990-01-05');
  assert.equal(profile.signals.nameTotal, 38);
  assert.equal(profile.signals.vowelTotal, 12);
  assert.equal(profile.signals.consonantTotal, 26);
  assert.equal(profile.contentKeys.lifePath, '257');
});

test('preserves supported signature values', () => {
  assert.equal(reduceSignal(29), 11);
  assert.equal(reduceSignal(38), 11);
  assert.equal(reduceSignal(22), 22);
});

test('rejects incomplete names and impossible dates', () => {
  assert.throws(() => calculateCoreProfile('', 'Morgan', '1992-07-16'));
  assert.throws(() => calculateCoreProfile('Alex', 'Morgan', '1992-02-31'));
});

test('validates each name separately and enforces the storage limit', () => {
  assert.throws(() => calculateCoreProfile('123', 'Morgan', '1992-07-16'));
  assert.throws(() => calculateCoreProfile('Alex', '---', '1992-07-16'));
  assert.throws(() => calculateCoreProfile('A'.repeat(81), 'Morgan', '1992-07-16'));
  assert.throws(() => calculateCoreProfile('Alex', 'M'.repeat(81), '1992-07-16'));
  assert.equal(calculateCoreProfile('Anne-Marie', "O’Neill", '1992-07-16').fullName, 'Anne-Marie O’Neill');
});
