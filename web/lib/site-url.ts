import { runtimeEnv } from './runtime-config';

// The public address of the site, used for share previews, robots.txt and the
// sitemap. SITE_URL must be set on every deployment; without it these point
// at localhost (docs/OPERATIONS.md, deploy checklist).
export function siteUrl(): URL {
  const configured = runtimeEnv.SITE_URL?.trim() || process.env.SITE_URL?.trim();
  return new URL(configured || 'http://localhost:3000');
}
