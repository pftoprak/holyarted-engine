import { authenticateRequest } from '@/lib/server-auth';
import { getMembership, publicMembership } from '@/lib/membership-store';

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const membership = await getMembership(user.id);
  return Response.json(publicMembership(membership));
}
