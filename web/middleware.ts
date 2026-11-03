import { NextResponse } from 'next/server';
import { securityHeaders } from './lib/security-headers';

// Security headers for pages and API responses alike. (next.config headers()
// reach only route handlers in this vinext version, not rendered pages.)
export function middleware() {
  const response = NextResponse.next();
  for (const { key, value } of securityHeaders) response.headers.set(key, value);
  return response;
}

export const config = { matcher: '/:path*' };
