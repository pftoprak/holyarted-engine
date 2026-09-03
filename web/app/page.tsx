import { Experience } from './experience';
import { getPublicAuthConfig } from '@/lib/runtime-config';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return <Experience authConfig={getPublicAuthConfig()} />;
}
