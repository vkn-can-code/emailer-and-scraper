import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/db/db';
import { generateOutreachEmail } from '@/lib/ai';
import { formatCompactNumber, parseCompactNumber, calculateEngagementRatio, calculateAverageViews } from '@/lib/metrics';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Get current lead data
    const lead: any = await prisma.channel.findUnique({
      where: { id }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const subsNum = parseCompactNumber(lead.subscriberCount);
    const viewsNum = parseCompactNumber(lead.viewCount);
    const videosNum = parseCompactNumber(lead.videoCount);
    
    const avgViews = calculateAverageViews(viewsNum, videosNum);
    const engagementScore = calculateEngagementRatio(viewsNum, subsNum, videosNum);

    // 2. Generate new email
    const email = await generateOutreachEmail({
      name: lead.name,
      subscriberCount: lead.subscriberCount || '0',
      viewCount: lead.viewCount || '0',
      videoCount: lead.videoCount || '0',
      averageViewsPerVideo: formatCompactNumber(avgViews),
      engagementScore: engagementScore
    });


    // 3. Update DB
    const updatedLead = await prisma.channel.update({
      where: { id },
      data: {
        emailSubject: email.subject,
        emailBody: email.body
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Regeneration failed:', error);
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 500 });
  }
}
