
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function parseCompactNumber(str: string | null | undefined): number {
  if (!str) return 0;
  const cleanStr = str.toString().replace(/,/g, '');
  return parseInt(cleanStr) || 0;
}

export function calculateEngagementRatio(views: number, subs: number, videos: number): string {
  if (subs === 0 || videos === 0) return "0% Views-to-Subs Ratio";
  const avgViews = Math.round(views / videos);
  const ratio = ((avgViews / subs) * 100).toFixed(2);
  return `${ratio}% Views-to-Subs Ratio`;
}

export function calculateAverageViews(views: number, videos: number): number {
  if (videos === 0) return 0;
  return Math.round(views / videos);
}
