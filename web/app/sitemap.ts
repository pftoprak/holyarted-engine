import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

// Public pages only; the profile and API are private.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ['/', '/privacy', '/terms', '/kvkk'].map((path) => ({ url: new URL(path, base).toString() }));
}
