import { accountsDisabledResponse } from '@/lib/features';
import { deleteGrant, listGrants, saveGrant, type GrantPlan } from '@/lib/membership-grants';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';
import { reportError } from '@/lib/report-error';
import { runtimeEnv } from '@/lib/runtime-config';
import { rateLimit } from '@/lib/shared-rate-limit';

// Give or remove a plan by hand (testers, team, gifts): scripts/grant.mjs.
// The route exists only when ADMIN_TOKEN is set to a long random secret.
const MIN_TOKEN_LENGTH = 32;
const MAX_DAYS = 3650;
const MAX_NOTE_LENGTH = 200;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

// null when the caller may continue; otherwise the response to send.
async function guard(request: Request): Promise<Response | null> {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const token = runtimeEnv.ADMIN_TOKEN?.trim() ?? '';
  if (token.length < MIN_TOKEN_LENGTH) return privateJson({ error: 'Not found.' }, 404);
  // Per client address, before the secret is compared.
  const limited = await rateLimit(request, 'admin', 'client', 10);
  if (limited) return limited;
  const given = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!safeEqual(given, token)) {
    await reportError('admin_auth_failed');
    return privateJson({ error: 'Unauthorized' }, 401);
  }
  return null;
}

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL.test(value.trim());
}

export async function GET(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    return privateJson({ grants: await listGrants() });
  } catch {
    await reportError('admin_grants_failed');
    return privateJson({ error: 'Grants are currently unavailable.' }, 503);
  }
}

// Body: { email, plan: 'plus' | 'premium', days?: number, note?: string }
export async function PUT(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readSmallJson(request)) as Record<string, unknown> | null;
    const plan = body?.plan;
    const days = body?.days;
    const note = body?.note;
    if (!validEmail(body?.email) || (plan !== 'plus' && plan !== 'premium')
      || (days !== undefined && (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > MAX_DAYS))
      || (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH))) {
      return privateJson({ error: 'Give a valid email, plan (plus or premium), optional days (1-3650) and optional note.' }, 400);
    }
    const expiresAt = typeof days === 'number' ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
    const grant = await saveGrant({ email: body.email as string, plan: plan as GrantPlan, expiresAt, note: typeof note === 'string' ? note : null });
    return privateJson({ grant });
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    await reportError('admin_grants_failed');
    return privateJson({ error: 'Grants are currently unavailable.' }, 503);
  }
}

// Body: { email }
export async function DELETE(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readSmallJson(request)) as Record<string, unknown> | null;
    if (!validEmail(body?.email)) return privateJson({ error: 'Give a valid email.' }, 400);
    await deleteGrant(body.email as string);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    await reportError('admin_grants_failed');
    return privateJson({ error: 'Grants are currently unavailable.' }, 503);
  }
}
