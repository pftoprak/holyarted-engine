import { requireRuntimeValue } from './runtime-config';

export async function deleteSupabaseUser(userId: string): Promise<void> {
  const url = requireRuntimeValue('SUPABASE_URL');
  const serviceRoleKey = requireRuntimeValue('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) throw new Error('Supabase account deletion failed.');
}
