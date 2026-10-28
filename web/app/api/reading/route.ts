import type { PortraitInput } from '@/lib/portrait-types';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';
import { buildReading } from '@/lib/reading';
import { enforceRateLimit } from '@/lib/request-limits';

const MAX_NAME_LENGTH = 80;
const INVALID_INPUT = 'Please provide a complete name and valid birth date.';

function validInput(value: unknown): value is PortraitInput {
  if (!value || typeof value !== 'object') return false;
  const { firstName, lastName, birthDate } = value as Record<string, unknown>;
  return typeof firstName === 'string' && typeof lastName === 'string' && typeof birthDate === 'string'
    && firstName.length <= MAX_NAME_LENGTH && lastName.length <= MAX_NAME_LENGTH;
}

// Public: the detailed reading needs no account. Input is used only to compute
// the response and is never stored or logged.
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'reading', 'anonymous', 30);
  if (limited) return limited;
  let input: unknown;
  try {
    input = await readSmallJson(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: INVALID_INPUT }, 400);
  }
  if (!validInput(input)) return privateJson({ error: INVALID_INPUT }, 400);
  try {
    return privateJson({ reading: buildReading(input.firstName, input.lastName, input.birthDate) });
  } catch {
    // calculateCoreProfile rejects empty names and impossible or future dates.
    return privateJson({ error: INVALID_INPUT }, 400);
  }
}
