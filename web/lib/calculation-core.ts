const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const SIGNATURE_VALUES = new Set([11, 19, 22, 33]);

export type CoreProfile = {
  algorithmVersion: 'holyarted-core-v1';
  fullName: string;
  signals: {
    dateTotal: number;
    dateSignature: number;
    birthDay: number;
    birthMonth: number;
    birthYearTotal: number;
    nameTotal: number;
    vowelTotal: number;
    consonantTotal: number;
  };
  contentKeys: {
    showcase: string;
    abilities: string;
    idealJob: string;
    lifePath: string;
  };
};

export function reduceSignal(total: number): number {
  let value = Math.abs(Math.trunc(total));
  while (value > 9 && !SIGNATURE_VALUES.has(value)) value = sumDigits(String(value));
  return value;
}

function reduceOnce(total: number): number {
  return total > 9 ? sumDigits(String(total)) : total;
}

function sumDigits(value: string): number {
  return Array.from(value).reduce((sum, digit) => sum + (digit >= '0' && digit <= '9' ? Number(digit) : 0), 0);
}

function normalizeLetters(value: string): string[] {
  return Array.from(value.toLocaleUpperCase('tr-TR').normalize('NFKD').replace(/\p{M}/gu, ''))
    .filter((letter) => letter in LETTER_VALUES);
}

function parseBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('A complete birth date is required.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) throw new Error('The birth date is not valid.');

  return { year, month, day };
}

export function calculateCoreProfile(firstName: string, lastName: string, birthDate: string): CoreProfile {
  const cleanFirstName = firstName.trim().replace(/\s+/g, ' ');
  const cleanLastName = lastName.trim().replace(/\s+/g, ' ');
  if (!cleanFirstName || !cleanLastName) throw new Error('A first and last name are required.');
  if (cleanFirstName.length > 80 || cleanLastName.length > 80) throw new Error('Name is too long.');
  if (!normalizeLetters(cleanFirstName).length || !normalizeLetters(cleanLastName).length) {
    throw new Error('Both first and last names must contain supported letters.');
  }

  const fullName = `${cleanFirstName} ${cleanLastName}`;
  const letters = normalizeLetters(fullName);
  if (!letters.length) throw new Error('The name must contain letters.');

  const { year, month, day } = parseBirthDate(birthDate);
  const nameTotal = letters.reduce((sum, letter) => sum + LETTER_VALUES[letter], 0);
  const vowelTotal = letters.reduce((sum, letter) => sum + (VOWELS.has(letter) ? LETTER_VALUES[letter] : 0), 0);
  const consonantTotal = nameTotal - vowelTotal;
  const dateTotal = sumDigits(birthDate);
  const dateSignature = reduceSignal(dateTotal);
  const birthYearTotal = sumDigits(String(year));

  return {
    algorithmVersion: 'holyarted-core-v1',
    fullName,
    signals: { dateTotal, dateSignature, birthDay: day, birthMonth: month, birthYearTotal, nameTotal, vowelTotal, consonantTotal },
    contentKeys: {
      showcase: String(reduceSignal(day)),
      abilities: String(reduceSignal(vowelTotal)),
      idealJob: String(reduceSignal(nameTotal)),
      lifePath: `${dateTotal}${reduceOnce(dateTotal)}`,
    },
  };
}
