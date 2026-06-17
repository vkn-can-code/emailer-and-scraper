'use client';

import { useState, useMemo } from 'react';
import { ProcessedChannel } from '@/types';
import { useToast } from '@/components/ToastProvider';
import Image from 'next/image';

interface ResultsTableProps {
  channels: ProcessedChannel[];
  onDelete?: (id: string) => void;
  onUpdate?: (updated: ProcessedChannel) => void;
}

export default function ResultsTable({ channels, onDelete, onUpdate }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ProcessedChannel | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { showToast } = useToast();

  const handleSendEmail = async () => {
    if (!selectedChannel) return;

    if (!selectedChannel.email) {
      showToast('No email address found for this channel. Upload an Excel first.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/leads/${selectedChannel.id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedChannel(updated);
        onUpdate?.(updated);
        showToast('Email sent successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to send email.', 'error');
      }
    } catch (error) {
      showToast('An error occurred while sending.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const getChannelInsight = (channel: ProcessedChannel) => {
    const subs = parseInt((channel.subscriberCount || '0').toString().replace(/,/g, '')) || 0;
    const views = parseInt((channel.viewCount || '0').toString().replace(/,/g, '')) || 0;
    const videos = parseInt((channel.videoCount || '1').toString().replace(/,/g, '')) || 1;
    const avgViews = views / videos;
    const ratio = subs > 0 ? avgViews / subs : 0;

    const Icon = ({ path }: { path: string }) => (
      <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
      </svg>
    );

    if (subs === 0) return { text: "No Data", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", icon: <Icon path="M20 12H4" /> };
    if (ratio > 0.5) return { text: "Viral Engagement", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: <Icon path="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /> };
    if (ratio > 0.1) return { text: "Healthy Growth", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> };
    if (subs < 10000 && ratio > 0.05) return { text: "Rising Star", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: <Icon path="M13 10V3L4 14h7v7l9-11h-7z" /> };
    if (ratio < 0.01 && subs > 10000) return { text: "Dead Audience", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> };
    if (ratio < 0.05) return { text: "Low Conversion", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> };
    return { text: "Average Performance", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> };
  };

  const handleRegenerate = async (id: string) => {
    setIsRegenerating(true);
    setIsEditing(false);
    try {
      const response = await fetch(`/api/leads/${id}/regenerate`, {
        method: 'POST',
      });
      if (response.ok) {
        const updated = await response.json();
        if (selectedChannel?.id === id) {
          setSelectedChannel(updated);
        }
        onUpdate?.(updated);
        showToast('Email regenerated successfully!', 'success');
      } else {
        showToast('Failed to regenerate email.', 'error');
      }
    } catch (error) {
      showToast('An error occurred during regeneration.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing && selectedChannel) {
      setEditEmail(selectedChannel.email || '');
      setEditSubject(selectedChannel.emailSubject || '');
      setEditBody(selectedChannel.emailBody || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    if (!selectedChannel) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${selectedChannel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editEmail, emailSubject: editSubject, emailBody: editBody })
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedChannel(updated);
        setIsEditing(false);
        onUpdate?.(updated);
        showToast('Email saved successfully!', 'success');
      } else {
        showToast('Failed to save edits.', 'error');
      }
    } catch (error) {
      showToast('An error occurred while saving.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-white font-extrabold tracking-tight text-lg">Analyzed Creators</h3>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative bg-black/40 border border-white/10 text-sm text-white px-5 py-2.5 rounded-xl w-64 focus:outline-none focus:border-indigo-500/80 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Metrics</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredChannels.map((channel) => (
                <tr key={channel.id} className="hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer" onClick={() => setSelectedChannel(channel)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={channel.avatar || ''}
                          alt={channel.name}
                          fill
                          sizes="40px"
                          className="rounded-xl border border-white/10 object-cover shadow-lg"
                        />
                      </div>
                      <span className="text-white font-extrabold tracking-tight">{channel.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-zinc-400">{channel.subscriberCount} Subs</span>
                      <span className="text-[10px] text-zinc-600">{channel.viewCount} Views</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(channel.id); }}
                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Lead"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedChannel(channel); }}
                        className="text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all"
                      >
                        View Draft
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedChannel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <Image
                    src={selectedChannel.avatar || ''}
                    alt={selectedChannel.name}
                    fill
                    sizes="56px"
                    className="rounded-2xl border border-white/10 object-cover shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{selectedChannel.name}</h2>
                  <p className="text-zinc-400 text-sm mt-0.5">Generated Outreach Draft</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannel(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-black/40">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Target Email</label>
                  {!isEditing && !selectedChannel.email && (
                    <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider">Missing Email</span>
                  )}
                </div>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Enter target email..."
                      className="relative w-full p-5 bg-black/60 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:border-indigo-500/80 transition-all shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-black/40 border border-white/10 rounded-2xl text-white font-medium flex items-center justify-between shadow-inner">
                    <span className="tracking-wide">{selectedChannel.email || 'No email associated'}</span>
                    {selectedChannel.email && (
                      <button
                        onClick={() => copyToClipboard(selectedChannel.email!, 'Email')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Email Subject</label>
                  {!isEditing && (
                    <button
                      onClick={() => copyToClipboard(selectedChannel.emailSubject || '', 'Subject')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                    >
                      Copy
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="relative w-full p-5 bg-black/60 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:border-indigo-500/80 transition-all shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-black/40 border border-white/10 rounded-2xl text-white font-medium shadow-inner">
                    {selectedChannel.emailSubject}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Email Body</label>
                  {!isEditing && (
                    <button
                      onClick={() => copyToClipboard(selectedChannel.emailBody || '', 'Body')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                    >
                      Copy Body
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={10}
                      className="relative w-full p-6 bg-black/60 border border-white/10 rounded-3xl text-zinc-300 text-[15px] leading-relaxed font-sans focus:outline-none focus:border-indigo-500/80 transition-all shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-black/40 border border-white/10 rounded-3xl text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                    {selectedChannel.emailBody}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-wrap">
                {selectedChannel.status === 'completed' && selectedChannel.senderEmail && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-400 font-bold uppercase">Sent by {selectedChannel.senderEmail}</span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Subs</p>
                  <p className="text-sm text-white font-mono">{selectedChannel.subscriberCount}</p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Views</p>
                  <p className="text-sm text-white font-mono">{selectedChannel.viewCount}</p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Avg. Views / Video</p>
                  <p className="text-sm text-white font-mono">
                    {Math.round((parseInt((selectedChannel.viewCount || '0').toString().replace(/,/g, '')) || 0) / (parseInt((selectedChannel.videoCount || '1').toString().replace(/,/g, '')) || 1)).toLocaleString()}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 ${getChannelInsight(selectedChannel).bg} ${getChannelInsight(selectedChannel).border}`}>
                  <span className={`flex items-center text-xs font-bold uppercase tracking-widest ${getChannelInsight(selectedChannel).color}`}>
                    {getChannelInsight(selectedChannel).icon}
                    {getChannelInsight(selectedChannel).text}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="px-6 py-3 bg-transparent hover:bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-8 py-3 bg-white hover:bg-zinc-100 text-black rounded-xl text-sm font-extrabold transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditToggle}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerate(selectedChannel.id)}
                        disabled={isRegenerating}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isRegenerating ? 'Regenerating...' : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Regenerate
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                      >
                        {isSending ? 'Sending...' : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            Send Email
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
