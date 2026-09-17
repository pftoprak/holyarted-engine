import { authenticateRequest } from '@/lib/server-auth';
import { getPortrait } from '@/lib/portrait-store';
import { getMembership, publicMembership } from '@/lib/membership-store';
import { privateJson } from '@/lib/private-response';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    const [portrait, membership] = await Promise.all([getPortrait(user.id), getMembership(user.id)]);
    return privateJson(
      { exportedAt: new Date().toISOString(), account: user, portrait, membership: publicMembership(membership) },
      200, { 'content-disposition': 'attachment; filename="holyarted-data.json"' },
    );
  } catch (error) {
    console.error('account_export_failed', error);
    return privateJson({ error: 'Your data could not be exported.' }, 503);
  }
}
