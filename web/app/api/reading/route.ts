import { reportError } from '@/lib/report-error';
import { requestPlan } from '@/lib/plan-access';
import { portraitChapters } from '@/lib/portrait-chapters';
import { isSupportedBirthDate, type PortraitInput } from '@/lib/portrait-types';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';
import { calculateDesign } from '@/lib/profile-engine';
import { buildReading, readingForPlan } from '@/lib/reading';
import { rateLimit } from '@/lib/shared-rate-limit';

const MAX_NAME_LENGTH = 80;
const INVALID_INPUT = 'Please provide a complete name and valid birth date.';

function validInput(value: unknown): value is PortraitInput {
  if (!value || typeof value !== 'object') return false;
  const { firstName, lastName, birthDate } = value as Record<string, unknown>;
  return typeof firstName === 'string' && typeof lastName === 'string' && typeof birthDate === 'string'
    && firstName.length <= MAX_NAME_LENGTH && lastName.length <= MAX_NAME_LENGTH && isSupportedBirthDate(birthDate);
}

// The portrait chapters and the detailed reading, filtered by the plan the
// server resolves for this request. Paid texts never leave the server for a
// plan that does not include them. Input is used only to compute the response
// and is never stored or logged.
export async function POST(request: Request) {
  // Per client address, before any auth or database call.
  const limited = await rateLimit(request, 'reading', 'client', 30);
  if (limited) return limited;
  let input: unknown;
  try {
    input = await readSmallJson(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: INVALID_INPUT }, 400);
  }
  if (!validInput(input)) return privateJson({ error: INVALID_INPUT }, 400);
  let plan;
  try {
    ({ plan } = await requestPlan(request));
  } catch {
    await reportError('reading_plan_unavailable');
    return privateJson({ error: 'Your reading could not be opened.' }, 503);
  }
  try {
    const profile = calculateDesign(input.firstName, input.lastName, input.birthDate);
    return privateJson({
      plan,
      chapters: { en: portraitChapters(profile, 'en', plan), tr: portraitChapters(profile, 'tr', plan) },
      reading: readingForPlan(buildReading(input.firstName, input.lastName, input.birthDate), plan),
    });
  } catch {
    // calculateCoreProfile rejects empty names and impossible or future dates.
    return privateJson({ error: INVALID_INPUT }, 400);
  }
}
