'use client';

import { ProcessedChannel } from '@/types';

interface StatsBarProps {
  channels: ProcessedChannel[];
}

export default function StatsBar({ channels }: StatsBarProps) {
  const totalLeads = channels.length;
  
  // Calculate Combined Subs
  const totalSubs = channels.reduce((acc, c) => {
    const num = parseInt((c.subscriberCount || '0').toString().replace(/,/g, '')) || 0;
    return acc + num;
  }, 0);

  // Calculate Average Engagement Rate
  const avgEngagement = channels.length > 0 ? (channels.reduce((acc, c) => {
    const subsNum = parseInt((c.subscriberCount || '0').toString().replace(/,/g, '')) || 1;
    const viewsNum = parseInt((c.viewCount || '0').toString().replace(/,/g, '')) || 0;
    const videosNum = parseInt((c.videoCount || '0').toString().replace(/,/g, '')) || 1;
    const avgViews = viewsNum / videosNum;
    const engagement = (avgViews / subsNum) * 100;
    return acc + engagement;
  }, 0) / channels.length).toFixed(1) : '0.0';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="glass-card p-8 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 relative z-10">Total Drafts</span>
        <span className="text-5xl font-extrabold tracking-tight text-white leading-none relative z-10">{totalLeads}</span>
      </div>
      
      <div className="glass-card p-8 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 relative z-10">Network Size (Subs)</span>
        <span className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 leading-none relative z-10">{formatNumber(totalSubs)}+</span>
      </div>

      <div className="glass-card p-8 flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 relative z-10">Avg. Engagement</span>
        <span className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400 leading-none relative z-10">{avgEngagement}%</span>
      </div>
    </div>
  );
}
