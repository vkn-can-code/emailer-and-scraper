import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic in-memory rate limiter
const ipRateLimitMap = new Map<string, { count: number, resetTime: number }>();

const RATE_LIMIT = 60; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Cleanup old entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimitMap.entries()) {
    if (now > record.resetTime) {
      ipRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // run every 5 minutes

function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateLimitMap.get(ip);
  
  if (!record) {
    ipRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true; // Allowed
  }
  
  if (now > record.resetTime) {
    ipRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true; // Allowed
  }
  
  if (record.count >= RATE_LIMIT) {
    return false; // Rate limited
  }
  
  record.count += 1;
  return true; // Allowed
}

export function proxy(request: NextRequest) {
  // 1. Rate Limiting Firewall
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Apply rate limit
  const isAllowed = applyRateLimit(ip);
  if (!isAllowed) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    });
  }

  // 2. Authentication Check for protected routes
  const path = request.nextUrl.pathname;
  
  // Protected API routes
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    const sessionCookie = request.cookies.get('admin-session')?.value;
    const expectedSecret = process.env.ADMIN_SESSION_SECRET || 'fallback_secret_do_not_use';
    
    if (sessionCookie !== expectedSecret) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
