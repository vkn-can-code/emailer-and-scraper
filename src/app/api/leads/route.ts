// Leads API Route - Updated with YouTube metrics
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';
import { fetchChannelData } from '@/lib/youtube';
import { generateOutreachEmail } from '@/lib/ai';
import { formatCompactNumber, parseCompactNumber, calculateEngagementRatio, calculateAverageViews } from '@/lib/metrics';

export async function GET(req: NextRequest) {
  try {
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
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const { urls, model, tier: filterTier, emailMap } = body;
    const emails: Record<string, string> = (emailMap && typeof emailMap === 'object') ? emailMap : {};
    
    if (!urls || !Array.isArray(urls) || !urls.every(u => typeof u === 'string')) {
      return NextResponse.json({ error: 'Invalid input. Expected an array of URL strings.' }, { status: 400 });
    }

    const results = [];

    for (const url of urls) {
      try {
        const channelData = await fetchChannelData(url);
        if (!channelData) continue;

        const subsNum = parseCompactNumber(channelData.subscriberCount);
        const viewsNum = parseCompactNumber(channelData.viewCount);
        const videosNum = parseCompactNumber(channelData.videoCount);
        
        const avgViews = calculateAverageViews(viewsNum, videosNum);
        const engagementScore = calculateEngagementRatio(viewsNum, subsNum, videosNum);
        
        // Determine Tier
        let tier = 'C';
        let score = 30;
        
        if (subsNum > 1000000) { tier = 'S'; score = 95; }
        else if (subsNum > 100000) { tier = 'A'; score = 85; }
        else if (subsNum > 10000) { tier = 'B'; score = 65; }

        if (filterTier && filterTier !== 'All') {
          if (filterTier === 'S' && tier !== 'S') continue;
          if (filterTier === 'A' && tier !== 'S' && tier !== 'A') continue;
        }

        const email = await generateOutreachEmail({
          name: channelData.name,
          subscriberCount: formatCompactNumber(subsNum),
          viewCount: channelData.viewCount,
          videoCount: channelData.videoCount,
          averageViewsPerVideo: formatCompactNumber(avgViews),
          engagementScore: engagementScore
        }, model || "openrouter/auto");

        // Find email from emailMap (match by URL or channel name)
        const channelEmail = emails[url] || emails[url.trim()] || emails[channelData.name] || null;

        const lead = await (prisma.channel as any).create({
          data: {
            name: channelData.name,
            handle: channelData.handle,
            avatar: channelData.avatar,
            subscriberCount: channelData.subscriberCount,
            viewCount: channelData.viewCount,
            videoCount: channelData.videoCount,
            leadScore: score,
            tier: tier,
            emailSubject: email.subject,
            emailBody: email.body,
            email: channelEmail,
            status: 'completed'
          }
        });

        results.push(lead);
      } catch (err) {
        console.error(`Error processing URL ${url}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: results.length, data: results });

  } catch (error) {
    console.error('Failed to process bulk leads:', error);
    return NextResponse.json({ error: 'Failed to process bulk leads' }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
