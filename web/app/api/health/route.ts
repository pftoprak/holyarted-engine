import { getPublicAuthConfig, runtimeEnv } from '@/lib/runtime-config';
import { privateJson } from '@/lib/private-response';

export async function GET() {
  try {
    if (!getPublicAuthConfig() || !runtimeEnv.DB) {
      return privateJson({ status: 'unavailable' }, 503);
    }
    await runtimeEnv.DB.prepare('SELECT 1').bind().first();
    return privateJson({ status: 'ok' });
  } catch {
    console.error('health_check_failed');
    return privateJson({ status: 'unavailable' }, 503);
  }
}
