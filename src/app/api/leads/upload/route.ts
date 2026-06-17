import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    let updatedCount = 0;
    let createdCount = 0;

    for (const row of data) {
      // Look for channel name and email in common column names
      const channelName = row.name || row.Name || row.channel || row.Channel || row.channelName;
      const email = row.email || row.Email || row.emailAddress || row.EmailAddress;

      if (channelName && email) {
        // Try to find existing lead by name
        const existing = await prisma.channel.findFirst({
          where: {
            name: {
              equals: channelName,
              mode: 'insensitive'
            }
          }
        });

        if (existing) {
          await (prisma.channel as any).update({
            where: { id: existing.id },
            data: { email }
          });
          updatedCount++;
        } else {
          // Create new if not found (optional, but good for tracking)
          await (prisma.channel as any).create({
            data: {
              name: channelName,
              email: email,
              status: 'pending'
            }
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: 'Upload successful', 
      updatedCount, 
      createdCount 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
