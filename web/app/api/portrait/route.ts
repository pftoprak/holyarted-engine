import { authenticateRequest } from '@/lib/server-auth';
import { getPortrait, InvalidPortraitError, savePortrait } from '@/lib/portrait-store';
import type { PortraitInput } from '@/lib/portrait-types';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });
    return Response.json({ portrait: await getPortrait(user.id) });
  } catch (error) {
    console.error('portrait_load_failed', error);
    return Response.json({ error: 'Your portrait could not be opened.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });
    const input = (await request.json()) as PortraitInput;
    return Response.json({ portrait: await savePortrait(user.id, input) });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof InvalidPortraitError) {
      return Response.json({ error: 'Please provide a complete name and valid birth date.' }, { status: 400 });
    }
    console.error('portrait_save_failed', error);
    return Response.json({ error: 'Your portrait could not be saved.' }, { status: 503 });
  }
}
