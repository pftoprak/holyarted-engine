import { Experience } from './experience';
import { purchasesAvailable } from '@/lib/billing';
import { accountsEnabled } from '@/lib/features';
import { portraitChapters } from '@/lib/portrait-chapters';
import { calculateDesign } from '@/lib/profile-engine';
import { getPublicAuthConfig } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

// The landing preview: a fixed sample portrait, limited to the Basic cards.
const SAMPLE = calculateDesign('Alex', 'Morgan', '1992-07-16');

export default async function Home() {
  const enabled = accountsEnabled();
  const authConfig = enabled ? getPublicAuthConfig() : null;
  const sample = { en: portraitChapters(SAMPLE, 'en', 'basic'), tr: portraitChapters(SAMPLE, 'tr', 'basic') };
  return <Experience accountsEnabled={enabled} purchasesEnabled={authConfig !== null && purchasesAvailable(enabled)} authConfig={authConfig} sample={sample} />;
}
