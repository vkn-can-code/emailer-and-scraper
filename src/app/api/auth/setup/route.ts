import { NextResponse } from 'next/server';
import prisma from '@/lib/db/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists. Setup is already complete.' });
    }

    const passwordHash = await hashPassword('password123');

    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ success: true, message: 'Database seeded! Admin user successfully created. You can now log in with admin / password123' });
  } catch (error: any) {
    console.error('Setup failed', error);
    return NextResponse.json({ error: 'Setup failed', details: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
