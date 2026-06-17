import OpenAI from 'openai';

const openRouterKey = process.env.OPENROUTER_API_KEY;
const openRouterUrl = "https://openrouter.ai/api/v1";

const openai = new OpenAI({
  apiKey: openRouterKey || "dummy-key-for-build",
  baseURL: openRouterUrl,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Email Generation App",
  }
});

export interface LeadContext {
  name: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  averageViewsPerVideo: string;
  engagementScore: string;
}

export async function generateOutreachEmail(context: LeadContext, requestedModel: string = "openrouter/auto") {
  const prompt = `Write a high-converting JSON outreach email for YouTube creator ${context.name}.
Metrics: ${context.subscriberCount} subs, ${context.averageViewsPerVideo} avg views, ${context.engagementScore} engagement.
Goal: Pitch YouTube Growth Agency services. Tone: Professional/Value-driven.
Return JSON: {"subject": "...", "body": "..."}`;

  try {
    const response = await openai.chat.completions.create({
      model: requestedModel,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Model ${requestedModel} failed:`, error);
  }

  // Final fallback if generation fails (e.g., if API key is out of credits or model doesn't exist)
  return {
    subject: `Scaling ${context.name} - Quick Question`,
    body: `Hi ${context.name},\n\nI've been following your channel and I'm really impressed by your current trajectory—reaching ${context.subscriberCount} subscribers is no small feat!\n\nHowever, looking at your recent view velocity, I know we can help you scale these numbers much faster. We run a specialized YouTube growth agency with a proven history of significantly improving view-to-sub conversion and overall video engagement for creators in your niche.\n\nWe'd love to audit your current strategy and show you exactly what we'd tweak to double your average views over the next few months. Are you open to a quick chat this week to discuss?\n\nBest regards,\nGrowth Team`
  };
}


