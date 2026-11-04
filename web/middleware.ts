import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy, createNonce, securityHeaders } from './lib/security-headers';

// Security headers for pages and API responses alike. (next.config headers()
// reach only route handlers in this vinext version, not rendered pages.)
// The policy also goes on the request, where the framework reads the nonce.
export function middleware(request: NextRequest) {
  const policy = contentSecurityPolicy(createNonce());
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('content-security-policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  for (const { key, value } of securityHeaders) response.headers.set(key, value);
  return response;
}

export const config = { matcher: '/:path*' };
