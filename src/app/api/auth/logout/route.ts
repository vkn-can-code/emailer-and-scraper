import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get('admin-session')?.value;

  if (sessionToken) {
    try {
      await prisma.user.update({
        where: { sessionToken },
        data: { sessionToken: null }
      });
    } catch(e) {
      // Ignore if user not found
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin-session');
  
  return response;
}
