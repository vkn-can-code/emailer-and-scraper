import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('admin-session')?.value;
  const expectedSecret = process.env.ADMIN_SESSION_SECRET || 'fallback_secret_do_not_use';
  
  if (sessionCookie === expectedSecret) {
    return NextResponse.json({ authenticated: true });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
