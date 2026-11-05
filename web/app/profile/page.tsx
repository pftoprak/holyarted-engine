import { notFound } from 'next/navigation';
import { accountsEnabled } from '@/lib/features';
import { getPublicAuthConfig } from '@/lib/runtime-config';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // Without sign-in configured there is no account to show.
  const authConfig = accountsEnabled() ? getPublicAuthConfig() : null;
  if (!authConfig) notFound();
  return <ProfileClient authConfig={authConfig} />;
}
