import abilities from '@/data/abilities.json';
import idealJob from '@/data/ideal_job.json';
import lifePath from '@/data/life_path.json';
import showcase from '@/data/showcase.json';
import { calculateCoreProfile } from './calculation-core';

// Server-only: the full numerology texts are read here and returned per
// request, so they never ship in the client bundle. Dataset texts are shown
// unchanged; only titles, order, explanations and framing belong to the app
// (audit/RAPOR-DENETIMI.md, sections 3 and 4-A).
type Dataset = Record<string, string>;

export type ReadingSectionId = 'showcase' | 'abilities' | 'idealJob' | 'lifePath';
export type ReadingTier = 'basic' | 'plus' | 'premium';
export type ReadingSection = {
  id: ReadingSectionId;
  tier: ReadingTier;
  title: string;
  key: string;
  reason: string;
  note: string | null;
  status: 'ready' | 'pending';
  paragraphs: string[];
};
export type RelationshipLine = { sectionId: ReadingSectionId; source: string; sentence: string };
export type Reading = { locale: 'tr'; sections: ReadingSection[]; relationships: RelationshipLine[] };

const datasets: Record<ReadingSectionId, Dataset> = { showcase, abilities, idealJob, lifePath };
const order: { id: ReadingSectionId; tier: ReadingTier }[] = [
  { id: 'showcase', tier: 'basic' },
  { id: 'abilities', tier: 'plus' },
  { id: 'lifePath', tier: 'plus' },
  { id: 'idealJob', tier: 'premium' },
];
const titles: Record<ReadingSectionId, string> = { showcase: 'Vitrin', abilities: 'Yetenekler', lifePath: 'Hayat yolu', idealJob: 'İdeal iş' };
const LIFE_PATH_NOTE = 'Bu metin bir olasılığı anlatır, yaşadıklarına dair bir tespit değildir.';
const YOUNG_ADULT_AGE = 25;
const RELATIONSHIP_LINES_PER_SECTION = 2;
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

function reduced(total: number, key: string): string {
  return String(total) === key ? `${total}.` : `${total}; bu ${key} sayısına indirgeniyor.`;
}

export function buildReading(firstName: string, lastName: string, birthDate: string, today = new Date()): Reading {
  const { contentKeys, signals } = calculateCoreProfile(firstName, lastName, birthDate);
  const young = ageOn(birthDate, today) < YOUNG_ADULT_AGE;
  const reasons: Record<ReadingSectionId, string> = {
    showcase: `Doğum günün ${reduced(signals.birthDay, contentKeys.showcase)}`,
    abilities: `Adındaki sesli harflerin (A, E, I, O, U) toplamı ${reduced(signals.vowelTotal, contentKeys.abilities)}`,
    idealJob: `Adındaki tüm harflerin toplamı ${reduced(signals.nameTotal, contentKeys.idealJob)}`,
    lifePath: `Doğum tarihindeki rakamların toplamı ${signals.dateTotal}; tek basamağa indirgenince ${contentKeys.lifePath.slice(String(signals.dateTotal).length)}.`,
  };

  const sections = order.map(({ id, tier }): ReadingSection => {
    const key = contentKeys[id];
    const text = datasets[id][key];
    const ready = typeof text === 'string' && !PLACEHOLDER.test(text.trim());
    // The key is a dataset number, not personal data.
    if (!ready) console.error(`reading_section_unavailable ${id}:${key}`);
    return {
      id,
      tier,
      title: id === 'idealJob' ? (young ? 'Yöneldiğin alanlar' : 'Derinleşme alanların') : titles[id],
      key,
      reason: reasons[id],
      note: id === 'lifePath' ? LIFE_PATH_NOTE : null,
      status: ready ? 'ready' : 'pending',
      paragraphs: ready ? paragraphs(text) : [],
    };
  });

  // "İlişkide sen": relationship sentences quoted from the sections, unchanged.
  const seen = new Set<string>();
  const relationships = sections
    .filter((section) => section.id !== 'idealJob')
    .flatMap((section) => section.paragraphs.flatMap(sentences)
      .filter((sentence) => RELATIONAL.test(sentence) && !seen.has(sentence) && seen.add(sentence))
      .slice(0, RELATIONSHIP_LINES_PER_SECTION)
      .map((sentence) => ({ sectionId: section.id, source: `${section.title} ${section.key}`, sentence })));

  return { locale: 'tr', sections, relationships };
}
