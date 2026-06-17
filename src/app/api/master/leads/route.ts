import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    
    const where: any = {};
    if (dateStr) {
      const parsedDate = Date.parse(dateStr);
      if (isNaN(parsedDate)) {
        return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
      }

      const date = new Date(parsedDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const leads = await prisma.channel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    });
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Failed to fetch master leads:', error);
    return NextResponse.json({ error: 'Failed to fetch master leads' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
