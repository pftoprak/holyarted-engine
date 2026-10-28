import abilities from '@/data/abilities.json';
import idealJob from '@/data/ideal_job.json';
import lifePath from '@/data/life_path.json';
import showcase from '@/data/showcase.json';
import { calculateCoreProfile } from './calculation-core';

// Server-only: the full numerology texts are read here and returned per
// request, so they never ship in the client bundle.
type Dataset = Record<string, string>;

export type ReadingSectionId = 'showcase' | 'abilities' | 'idealJob' | 'lifePath';
export type ReadingSection = { id: ReadingSectionId; key: string; paragraphs: string[] };
export type Reading = { locale: 'tr'; sections: ReadingSection[] };

const datasets: Record<ReadingSectionId, Dataset> = {
  showcase,
  abilities,
  idealJob,
  lifePath,
};

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

export function buildReading(firstName: string, lastName: string, birthDate: string): Reading {
  const { contentKeys } = calculateCoreProfile(firstName, lastName, birthDate);
  const sections = (Object.keys(datasets) as ReadingSectionId[]).flatMap((id) => {
    const key = contentKeys[id];
    const text = datasets[id][key];
    return text ? [{ id, key, paragraphs: paragraphs(text) }] : [];
  });
  return { locale: 'tr', sections };
}
