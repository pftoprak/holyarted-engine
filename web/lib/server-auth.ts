import { getPublicAuthConfig } from './runtime-config';

export type HolyartedUser = {
  id: string;
  email: string;
  displayName: string;
};

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
};

export async function authenticateRequest(
  request: Request,
): Promise<HolyartedUser | null> {
  const config = getPublicAuthConfig();
  const authorization = request.headers.get('authorization');
  if (!config || !authorization?.startsWith('Bearer ')) return null;

  const response = await fetch(`${config.url}/auth/v1/user`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
    headers: {
      apikey: config.publishableKey,
      authorization,
    },
  });
  if (!response.ok) return null;

  const user = (await response.json()) as SupabaseUserResponse;
  if (!user.id || !user.email) return null;
  const displayName =
    user.user_metadata?.full_name?.trim() ||
    user.user_metadata?.name?.trim() ||
    user.email.split('@')[0];

  return { id: user.id, email: user.email, displayName };
}
