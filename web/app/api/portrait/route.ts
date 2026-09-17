import { authenticateRequest } from '@/lib/server-auth';
import { deletePortrait, getPortrait, InvalidPortraitError, savePortrait } from '@/lib/portrait-store';
import type { PortraitInput } from '@/lib/portrait-types';
import { privateJson, readSmallJson, RequestBodyError } from '@/lib/private-response';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    return privateJson({ portrait: await getPortrait(user.id) });
  } catch (error) {
    console.error('portrait_load_failed', error);
    return privateJson({ error: 'Your portrait could not be opened.' }, 503);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    await deletePortrait(user.id);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('portrait_delete_failed', error);
    return privateJson({ error: 'Your portrait could not be deleted.' }, 503);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    const input = (await readSmallJson(request)) as PortraitInput;
    return privateJson({ portrait: await savePortrait(user.id, input) });
  } catch (error) {
    if (error instanceof RequestBodyError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError || error instanceof InvalidPortraitError) {
      return privateJson({ error: 'Please provide a complete name and valid birth date.' }, 400);
    }
    console.error('portrait_save_failed', error);
    return privateJson({ error: 'Your portrait could not be saved.' }, 503);
  }
}
