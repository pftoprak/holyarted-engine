import { notFound } from 'next/navigation';
import { accountsEnabled } from '@/lib/features';
import { getPublicAuthConfig } from '@/lib/runtime-config';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  if (!accountsEnabled()) notFound();
  return <ProfileClient authConfig={getPublicAuthConfig()} />;
}
