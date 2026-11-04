// The mobile app keeps its own copy of the calculation engine. This fails as
// soon as the two copies would give anyone a different result.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as webCore from './calculation-core.ts';
import * as mobileCore from '../../mobile/lib/calculation-core.ts';

const NAMES = [
  ['Ada', 'Yılmaz'], ['Barış', 'Kaya'], ['Ece Su', 'Kaya'], ['Lyn', 'Sky'], ['Çağrı', 'Öztürk'],
  ['İpek', 'Şahin'], ['Ğülşen', 'Üçer'], ['Mary-Jane', "O'Neil"], ['A', 'B'], ['Zeynep Nur', 'Ağaoğlu'],
];

function dates() {
  const result = [];
  for (let time = Date.UTC(1900, 0, 1); time <= Date.now(); time += 7 * 86_400_000) {
    result.push(new Date(time).toISOString().slice(0, 10));
  }
  return result;
}

test('web and mobile engines agree for every weekly date since 1900 and varied names', () => {
  let compared = 0;
  for (const birthDate of dates()) {
    for (const [first, last] of NAMES) {
      assert.deepEqual(mobileCore.calculateCoreProfile(first, last, birthDate), webCore.calculateCoreProfile(first, last, birthDate), `${first} ${last} ${birthDate}`);
      compared += 1;
    }
  }
  assert.ok(compared > 60_000);
});

test('web and mobile engines reject the same invalid input', () => {
  for (const [first, last, birthDate] of [['', 'Kaya', '1990-01-01'], ['Ada', 'Kaya', '1990-02-30'], ['Ada', 'Kaya', '2999-01-01'], ['Ada', 'Kaya', 'yesterday']]) {
    assert.throws(() => webCore.calculateCoreProfile(first, last, birthDate));
    assert.throws(() => mobileCore.calculateCoreProfile(first, last, birthDate));
  }
});

// profile-engine maps the core signals to portrait keys; it must stay identical.
test('web and mobile profile mapping are the same code', () => {
  const source = (file) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/s+/g, '');
  assert.equal(source('../../mobile/lib/profile-engine.ts'), source('./profile-engine.ts'));
});
