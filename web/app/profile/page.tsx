import { getPublicAuthConfig } from '@/lib/runtime-config';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  return <ProfileClient authConfig={getPublicAuthConfig()} />;
}
