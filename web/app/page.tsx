import { Experience } from './experience';
import { accountsEnabled } from '@/lib/features';
import { getPublicAuthConfig } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const enabled = accountsEnabled();
  return <Experience accountsEnabled={enabled} authConfig={enabled ? getPublicAuthConfig() : null} />;
}
