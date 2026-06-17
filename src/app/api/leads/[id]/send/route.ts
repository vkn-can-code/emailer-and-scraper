import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/db/db';
import nodemailer from 'nodemailer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid ID parameter' }, { status: 400 });
    }
    
    const senderName = 'Admin';

    const lead: any = await prisma.channel.findUnique({
      where: { id }
    });

    if (!lead || !lead.email) {
      return NextResponse.json({ error: 'Lead or email not found' }, { status: 404 });
    }

    const subject = lead.emailSubject || 'Outreach';
    const body = lead.emailBody || '';

    // Verify SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
       return NextResponse.json({ error: 'SMTP configuration is missing in environment variables.' }, { status: 500 });
    }

    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    
    // Create a Nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${senderName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, 
      to: lead.email, 
      subject: subject,
      text: body,
    });

    console.log('Message sent: %s', info.messageId);

    // Update lead status
    const updated = await (prisma.channel as any).update({
      where: { id },
      data: {
        status: 'completed',
        sentAt: new Date(),
        senderEmail: process.env.SMTP_FROM || process.env.SMTP_USER
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('SMTP error:', error);
    return NextResponse.json({ error: `[User: ${process.env.SMTP_USER}] ` + (error.message || 'Failed to send email') }, { status: 500 });
  }
}
