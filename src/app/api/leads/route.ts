import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/db';
import { fetchChannelData } from '@/lib/youtube';
import { generateOutreachEmail } from '@/lib/ai';
import { formatCompactNumber, parseCompactNumber, calculateEngagementRatio, calculateAverageViews } from '@/lib/metrics';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    
    const where: any = { userId: user.id };
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

import { scrapeEmailFromUrl, scrapeEmailsFromText } from '@/lib/scraper';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    
    // Process in batches of 10 to avoid serverless timeouts (524 error)
    const BATCH_SIZE = 10;
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (url) => {
        try {
          const channelData = await fetchChannelData(url);
          if (!channelData) return null;

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
            if (filterTier === 'S' && tier !== 'S') return null;
            if (filterTier === 'A' && tier !== 'S' && tier !== 'A') return null;
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
          let channelEmail = emails[url] || emails[url.trim()] || emails[channelData.name] || null;

          // Attempt advanced scraper fallback
          if (!channelEmail && channelData.description) {
            const descEmails = scrapeEmailsFromText(channelData.description);
            if (descEmails.length > 0) {
              channelEmail = descEmails[0];
            }
          }

          if (!channelEmail) {
            const scrapedEmail = await scrapeEmailFromUrl(url, 8000); // 8 second timeout instead of 15s
            if (scrapedEmail) {
              channelEmail = scrapedEmail;
            }
          }

          const lead = await (prisma.channel as any).create({
            data: {
              userId: user.id,
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

          return lead;
        } catch (err) {
          console.error(`Error processing URL ${url}:`, err);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean));
    }

    return NextResponse.json({ success: true, count: results.length, data: results });

  } catch (error) {
    console.error('Failed to process bulk leads:', error);
    return NextResponse.json({ error: 'Failed to process bulk leads' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
