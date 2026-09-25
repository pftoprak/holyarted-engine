import { authenticateRequest } from '@/lib/server-auth';
import { deleteAccount } from '@/lib/account-deletion';
import { privateJson } from '@/lib/private-response';

export async function DELETE(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return privateJson({ error: 'Sign in is required.' }, 401);
    await deleteAccount(user.id);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  } catch {
    console.error('account_delete_failed');
    return privateJson({ error: 'Account deletion is currently unavailable.' }, 503);
  }
}
