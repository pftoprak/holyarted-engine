import { authenticateRequest } from '@/lib/server-auth';
import { getMembership, publicMembership } from '@/lib/membership-store';
import { privateJson } from '@/lib/private-response';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Unauthorized' }, 401);
    const membership = await getMembership(user.id);
    return privateJson(publicMembership(membership));
  } catch (error) {
    console.error('membership_load_failed');
    return privateJson({ error: 'Your membership could not be opened.' }, 503);
  }
}
