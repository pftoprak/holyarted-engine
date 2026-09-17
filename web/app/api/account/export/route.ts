import { authenticateRequest } from '@/lib/server-auth';
import { getPortrait } from '@/lib/portrait-store';
import { getMembership, publicMembership } from '@/lib/membership-store';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });
    const [portrait, membership] = await Promise.all([getPortrait(user.id), getMembership(user.id)]);
    return Response.json(
      { exportedAt: new Date().toISOString(), account: user, portrait, membership: publicMembership(membership) },
      { headers: { 'cache-control': 'no-store', 'content-disposition': 'attachment; filename="holyarted-data.json"' } },
    );
  } catch (error) {
    console.error('account_export_failed', error);
    return Response.json({ error: 'Your data could not be exported.' }, { status: 503 });
  }
}
