import abilities from '../data/abilities.json';
import idealJobs from '../data/ideal_job.json';
import showcase from '../data/showcase.json';

export type Decision = 'facts' | 'voice' | 'instinct' | 'time';
export type Environment = 'quiet' | 'together' | 'variety' | 'motion';
export type Friction = 'switching' | 'ambiguity' | 'access' | 'stagnation';
export type Purpose = 'build' | 'guide' | 'create' | 'connect';
type ContentMap = Record<string, string>;

const letterValues: Record<string, number> = { A: 1, B: 2, C: 3, Ç: 3, D: 4, E: 5, F: 6, G: 7, Ğ: 7, H: 8, I: 9, İ: 9, J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, Ö: 6, P: 7, Q: 8, R: 9, S: 1, Ş: 1, T: 2, U: 3, Ü: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8 };
const decisionKeys: Decision[] = ['instinct', 'voice', 'facts', 'time'];
const environmentKeys: Environment[] = ['motion', 'together', 'variety', 'quiet'];
const frictionKeys: Friction[] = ['ambiguity', 'access', 'switching', 'stagnation'];
const purposeKeys: Purpose[] = ['build', 'connect', 'create', 'guide'];

function reduceNumber(total: number) { let value = total; while (value > 9 && ![11, 22, 33].includes(value)) value = String(value).split('').reduce((sum, digit) => sum + Number(digit), 0); return value; }
function sumDigits(value: string) { return value.replace(/\D/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0); }
function sumName(name: string) { return Array.from(name.toLocaleUpperCase('tr-TR')).reduce((sum, letter) => sum + (letterValues[letter] ?? 0), 0); }
function pick(map: ContentMap, key: number) { return map[String(key)] ?? map[String(reduceNumber(key))] ?? map['9']; }
function publicExcerpt(raw: string) {
  const cleaned = raw.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  const replacements: Array<[string[], string]> = [[['enerji', 'energy'], 'kapasite'], [['ruhsal', 'spirit'], 'kişisel'], [['ruh'], 'karakter'], [['kader'], 'yön'], [['evrensel'], 'geniş'], [['bolluk'], 'olanak'], [['titreşim'], 'etki'], [['tekâmül', 'tekamül'], 'gelişim']];
  return cleaned.replace(/\S+/g, (token) => { const normalized = token.toLocaleLowerCase('tr-TR'); const replacement = replacements.find(([needles]) => needles.some((needle) => normalized.includes(needle)))?.[1]; if (!replacement) return token; return `${replacement}${token.match(/[.,;:!?]$/)?.[0] ?? ''}`; });
}
function mappedKey<T>(keys: T[], value: number) { return keys[(reduceNumber(value) - 1 + keys.length) % keys.length]; }

export function calculateDesign(firstName: string, lastName: string, birthDate: string) {
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const lifeNumber = reduceNumber(sumDigits(birthDate));
  const expressionNumber = reduceNumber(sumName(fullName));
  const directionNumber = reduceNumber(lifeNumber + expressionNumber);
  return { fullName: fullName || 'Your profile', decision: mappedKey(decisionKeys, lifeNumber), environment: mappedKey(environmentKeys, expressionNumber), friction: mappedKey(frictionKeys, lifeNumber + directionNumber), purpose: mappedKey(purposeKeys, directionNumber), source: { essence: publicExcerpt(pick(showcase as ContentMap, lifeNumber)), strength: publicExcerpt(pick(abilities as ContentMap, expressionNumber)), work: publicExcerpt(pick(idealJobs as ContentMap, directionNumber)) } };
}

export type CalculatedProfile = ReturnType<typeof calculateDesign>;
