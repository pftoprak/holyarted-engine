import abilities from '@/data/abilities.json';
import idealJob from '@/data/ideal_job.json';
import lifePath from '@/data/life_path.json';
import showcase from '@/data/showcase.json';
import abilitiesEn from '@/data/en/abilities.json';
import idealJobEn from '@/data/en/ideal_job.json';
import showcaseEn from '@/data/en/showcase.json';
import { calculateCoreProfile } from './calculation-core';
import { planIncludes, type MembershipPlan } from './plans';

// Server-only: the full numerology texts are read here and returned per
// request, so they never ship in the client bundle. Dataset texts are shown
// unchanged and exist in Turkish only; titles, explanations and notes belong
// to the app and come in both interface languages
// (audit/RAPOR-DENETIMI.md, sections 3 and 4-A).
type Dataset = Record<string, string>;
export type Localized = { en: string; tr: string };

export type ReadingSectionId = 'showcase' | 'abilities' | 'idealJob' | 'lifePath';
export type ReadingTier = MembershipPlan;
export type ReadingSection = {
  id: ReadingSectionId;
  tier: ReadingTier;
  title: Localized;
  key: string;
  reason: Localized;
  note: Localized | null;
  status: 'ready' | 'pending' | 'locked';
  paragraphs: string[];
  // English translation of the same dataset text, where one exists
  // (web/data/en/). The Turkish files are never changed.
  paragraphsEn: string[] | null;
};
export type RelationshipLine = { sectionId: ReadingSectionId; sentence: string };
export type Reading = {
  // The language of the dataset texts (paragraphs and relationship lines).
  locale: 'tr';
  sections: ReadingSection[];
  relationships: RelationshipLine[];
  relationshipsLocked: boolean;
};

const datasets: Record<ReadingSectionId, Dataset> = { showcase, abilities, idealJob, lifePath };
const translations: Partial<Record<ReadingSectionId, Dataset>> = { showcase: showcaseEn, abilities: abilitiesEn, idealJob: idealJobEn };
const order: { id: ReadingSectionId; tier: ReadingTier }[] = [
  { id: 'showcase', tier: 'basic' },
  { id: 'abilities', tier: 'plus' },
  { id: 'lifePath', tier: 'plus' },
  { id: 'idealJob', tier: 'premium' },
];
const titles: Record<ReadingSectionId, Localized> = {
  showcase: { en: 'Showcase', tr: 'Vitrin' },
  abilities: { en: 'Abilities', tr: 'Yetenekler' },
  lifePath: { en: 'Life path', tr: 'Hayat yolu' },
  idealJob: { en: 'Ideal work', tr: 'İdeal iş' },
};
// Age framing for the ideal work section; the dataset text is the same.
const IDEAL_JOB_YOUNG: Localized = { en: 'Directions you lean toward', tr: 'Yöneldiğin alanlar' };
const IDEAL_JOB_ADULT: Localized = { en: 'Areas to deepen', tr: 'Derinleşme alanların' };
const LIFE_PATH_NOTE: Localized = {
  en: 'This text describes a possibility, not a finding about your life.',
  tr: 'Bu metin bir olasılığı anlatır, yaşadıklarına dair bir tespit değildir.',
};
const YOUNG_ADULT_AGE = 25;
const RELATIONSHIP_LINES_PER_SECTION = 2;
const RELATIONSHIP_TIER: ReadingTier = 'plus';
// Placeholder rows ("n/a", "-", empty) are data errors; they are never shown.
const PLACEHOLDER = /^(n\/?a|-|tbd|todo)?$/i;
// Word stems that mark a sentence as being about relationships.
// "sınır" excludes "sınırlandırma" (rules, not personal boundaries).
const RELATIONAL = /(?<!\p{L})(ilişki|partner|sevgili|sevdik|aşk|yakınlık|bağ kur|bağlan|çatışma|sınır(?!land)|iletişim|aile)/iu;

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

function sentences(paragraph: string): string[] {
  return paragraph.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function ageOn(birthDate: string, today: Date): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  const beforeBirthday = today.getUTCMonth() + 1 < month || (today.getUTCMonth() + 1 === month && today.getUTCDate() < day);
  return today.getUTCFullYear() - year - (beforeBirthday ? 1 : 0);
}

function reduced(total: number, key: string): Localized {
  return String(total) === key
    ? { en: `${total}.`, tr: `${total}.` }
    : { en: `${total}, which reduces to ${key}.`, tr: `${total}; bu ${key} sayısına indirgeniyor.` };
}

export function buildReading(firstName: string, lastName: string, birthDate: string, today = new Date()): Reading {
  const { contentKeys, signals } = calculateCoreProfile(firstName, lastName, birthDate);
  const young = ageOn(birthDate, today) < YOUNG_ADULT_AGE;
  const day = reduced(signals.birthDay, contentKeys.showcase);
  const vowels = reduced(signals.vowelTotal, contentKeys.abilities);
  const letters = reduced(signals.nameTotal, contentKeys.idealJob);
  const lifeDigit = contentKeys.lifePath.slice(String(signals.dateTotal).length);
  const reasons: Record<ReadingSectionId, Localized> = {
    showcase: { en: `Your day of birth is ${day.en}`, tr: `Doğum günün ${day.tr}` },
    abilities: { en: `The vowels in your name (A, E, I, O, U) add up to ${vowels.en}`, tr: `Adındaki sesli harflerin (A, E, I, O, U) toplamı ${vowels.tr}` },
    idealJob: { en: `All letters in your name add up to ${letters.en}`, tr: `Adındaki tüm harflerin toplamı ${letters.tr}` },
    lifePath: {
      en: `The digits of your birth date add up to ${signals.dateTotal}; reduced to one digit, ${lifeDigit}.`,
      tr: `Doğum tarihindeki rakamların toplamı ${signals.dateTotal}; tek basamağa indirgenince ${lifeDigit}.`,
    },
  };

  const sections = order.map(({ id, tier }): ReadingSection => {
    const key = contentKeys[id];
    const text = datasets[id][key];
    const ready = typeof text === 'string' && !PLACEHOLDER.test(text.trim());
    const translated = translations[id]?.[key];
    // The key is a dataset number, not personal data.
    if (!ready) console.error(`reading_section_unavailable ${id}:${key}`);
    return {
      id,
      tier,
      title: id === 'idealJob' ? (young ? IDEAL_JOB_YOUNG : IDEAL_JOB_ADULT) : titles[id],
      key,
      reason: reasons[id],
      note: id === 'lifePath' ? LIFE_PATH_NOTE : null,
      status: ready ? 'ready' : 'pending',
      paragraphs: ready ? paragraphs(text) : [],
      paragraphsEn: ready && typeof translated === 'string' ? paragraphs(translated) : null,
    };
  });

  // "İlişkide sen": relationship sentences quoted from the sections, unchanged.
  const seen = new Set<string>();
  const relationships = sections
    .filter((section) => section.id !== 'idealJob')
    .flatMap((section) => section.paragraphs.flatMap(sentences)
      .filter((sentence) => RELATIONAL.test(sentence) && !seen.has(sentence) && seen.add(sentence))
      .slice(0, RELATIONSHIP_LINES_PER_SECTION)
      .map((sentence) => ({ sectionId: section.id, sentence })));

  return { locale: 'tr', sections, relationships, relationshipsLocked: false };
}

// Removes every text the plan does not include. Locked sections keep only
// their heading and reason, so the page can show what an upgrade opens.
export function readingForPlan(reading: Reading, plan: MembershipPlan): Reading {
  const sections = reading.sections.map((section): ReadingSection => (planIncludes(plan, section.tier)
    ? section
    : { ...section, status: 'locked', paragraphs: [], paragraphsEn: null }));
  const open = new Set(sections.filter((section) => section.status !== 'locked').map((section) => section.id));
  const relationshipsLocked = !planIncludes(plan, RELATIONSHIP_TIER);
  return {
    ...reading,
    sections,
    relationships: relationshipsLocked ? [] : reading.relationships.filter((line) => open.has(line.sectionId)),
    relationshipsLocked,
  };
}
