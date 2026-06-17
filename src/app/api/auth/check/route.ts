import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('admin-session')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { sessionToken }
    });

    if (user) {
      return NextResponse.json({ 
        authenticated: true,
        user: { username: user.username, role: user.role }
      });
    }
  } catch (err) {
    console.error(err);
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
