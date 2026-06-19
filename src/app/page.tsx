'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'bulk'>('bulk');
  const [urls, setUrls] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openrouter/auto');
  const [generatedLeads, setGeneratedLeads] = useState<any[]>([]);
  const [isRegeneratingId, setIsRegeneratingId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();
  const { logout } = useAuth();

  // Map of channel URL/name -> email from uploaded Excel
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet) as any[];

      const urlList: string[] = [];
      const newEmailMap: Record<string, string> = {};

      for (const row of data) {
        const url = row.url || row.URL || row.link || row.Link || row.youtube || row.YouTube || row.channel_url || row.ChannelUrl;
        const email = row.email || row.Email || row.emailAddress || row.EmailAddress;
        const name = row.name || row.Name || row.channel || row.Channel;

        if (url) {
          urlList.push(url.toString().trim());
          if (email) {
            newEmailMap[url.toString().trim()] = email.toString().trim();
          }
        }
        // Also store by name if available
        if (name && email) {
          newEmailMap[name.toString().trim()] = email.toString().trim();
        }
      }

      if (urlList.length > 0) {
        setMode('bulk');
        setUrls(urlList.join('\n'));
        setEmailMap(newEmailMap);
        showToast(`Loaded ${urlList.length} channels with ${Object.keys(newEmailMap).length} emails from Excel!`, 'success');
      } else {
        showToast('No URLs found in the file. Make sure you have a "url" or "link" column.', 'error');
      }
    } catch (error) {
      showToast('Failed to parse the Excel file.', 'error');
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${type} copied to clipboard!`, 'success');
  };

  const getChannelInsight = (channel: any) => {
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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = mode === 'single' 
      ? [urls.trim()] 
      : urls.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    if (urlList.length === 0 || !urlList[0]) return;

    setIsAnalyzing(true);
    setGeneratedLeads([]);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          urls: urlList,
          model: selectedModel,
          emailMap: emailMap
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        showToast(`Successfully analyzed ${result.data.length} channel(s)!`, 'success');
        setGeneratedLeads(result.data);
      } else {
        showToast('Failed to process. Check your API keys.', 'error');
      }
    } catch (error) {
      showToast('Network error during analysis.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    setIsRegeneratingId(id);
    setEditingLeadId(null);
    try {
      const response = await fetch(`/api/leads/${id}/regenerate`, {
        method: 'POST',
      });
      if (response.ok) {
        const updated = await response.json();
        setGeneratedLeads(prev => prev.map(l => l.id === id ? updated : l));
        showToast('Email regenerated successfully!', 'success');
      } else {
        showToast('Failed to regenerate email.', 'error');
      }
    } catch (error) {
      showToast('An error occurred during regeneration.', 'error');
    } finally {
      setIsRegeneratingId(null);
    }
  };

  const handleEditToggle = (lead: any) => {
    if (editingLeadId === lead.id) {
      setEditingLeadId(null);
    } else {
      setEditingLeadId(lead.id);
      setEditSubject(lead.emailSubject || '');
      setEditBody(lead.emailBody || '');
    }
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSubject: editSubject, emailBody: editBody })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setGeneratedLeads(prev => prev.map(l => l.id === id ? updated : l));
        setEditingLeadId(null);
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
    <div className="min-h-screen bg-transparent text-white flex flex-col relative">
      {/* Navigation Bar */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-2xl px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="font-extrabold tracking-tight text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Email Gen</span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-white tracking-wide">Analysis Tool</Link>
            <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors tracking-wide">Campaign Dashboard</Link>
          </div>
        </div>
        <button onClick={logout} className="text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em] border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">Sign Out</button>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 pt-16 relative z-10">
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Channel Analysis Tool
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-lg">
            Generate highly-personalized outreach emails for YouTube creators. Paste a single link or a bulk list to get started.
          </p>
        </header>

        {generatedLeads.length === 0 ? (
          <form onSubmit={handleAnalyze} className="space-y-8 animate-fade-in">
            {/* Mode Selection */}
            <div className="flex justify-center">
              <div className="bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 flex gap-1 shadow-inner backdrop-blur-md">
                <button 
                  type="button"
                  onClick={() => setMode('single')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === 'single' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Single Channel
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('bulk')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === 'bulk' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Bulk Analysis
                </button>
              </div>
            </div>

            <div className="glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {mode === 'single' ? 'YouTube Channel Link' : 'Bulk Channel Links'}
                </label>
                {mode === 'bulk' && (
                  <div className="flex items-center gap-4">
                    {Object.keys(emailMap).length > 0 && (
                      <span className="text-[10px] text-green-400 font-bold uppercase">
                        {Object.keys(emailMap).length} emails loaded
                      </span>
                    )}
                    <label className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest cursor-pointer transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Upload Excel
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
                    </label>
                    <span className="text-[10px] text-zinc-600">One URL per line</span>
                  </div>
                )}
              </div>
              
              {mode === 'single' ? (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                  <input
                    type="text"
                    placeholder="https://youtube.com/@MrBeast"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    className="relative w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-indigo-100 focus:outline-none focus:border-indigo-500/80 transition-all font-mono text-sm placeholder:text-zinc-700 shadow-inner"
                  />
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                  <textarea
                    placeholder="https://youtube.com/@MrBeast&#10;https://youtube.com/channel/UC-lHJZR3Gquu24_VdJJXYmc"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    rows={8}
                    className="relative w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-indigo-100 focus:outline-none focus:border-indigo-500/80 transition-all font-mono text-sm placeholder:text-zinc-700 shadow-inner"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-8">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">AI Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="openrouter/auto" className="bg-zinc-900 text-white font-bold">OpenRouter (Auto Routing)</option>
                    <option value="local/periscope" className="bg-indigo-900 text-white font-bold">Local LLM (Periscope)</option>
                    <option value="openai/gpt-5.5" className="bg-zinc-900 text-white">GPT-5.5 Standard</option>
                    <option value="openai/gpt-5.5-mini" className="bg-zinc-900 text-white">GPT-5.5 Mini</option>
                    <option value="openai/gpt-5.4" className="bg-zinc-900 text-white">GPT-5.4 Standard</option>
                    <option value="openai/gpt-5.4-mini" className="bg-zinc-900 text-white">GPT-5.4 Mini</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="relative flex-[2] group bg-white hover:bg-zinc-100 text-black py-4 rounded-xl font-extrabold transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Generating Emails...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      Start Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {generatedLeads.map((lead, idx) => (
              <div key={idx} className="glass-card w-full overflow-hidden flex flex-col border-white/10 shadow-2xl animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <img src={lead.avatar || ''} className="w-12 h-12 rounded-xl border border-white/10" alt="" />
                    <div>
                      <h2 className="text-xl font-bold text-white leading-none">{lead.name}</h2>
                      <p className="text-zinc-500 text-xs mt-1">Generated Outreach Draft</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8 bg-black/40">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Subject</label>
                        {editingLeadId !== lead.id && (
                          <button 
                            onClick={() => copyToClipboard(lead.emailSubject || '', 'Subject')}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      {editingLeadId === lead.id ? (
                        <input 
                          type="text" 
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      ) : (
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                          {lead.emailSubject}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Body</label>
                        {editingLeadId !== lead.id && (
                          <button 
                            onClick={() => copyToClipboard(lead.emailBody || '', 'Body')}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
                          >
                            Copy Body
                          </button>
                        )}
                      </div>
                      {editingLeadId === lead.id ? (
                        <textarea 
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={10}
                          className="w-full p-6 bg-white/5 border border-white/20 rounded-xl text-zinc-300 text-sm leading-relaxed font-sans focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      ) : (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {lead.emailBody}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    {editingLeadId === lead.id ? (
                      <>
                        <button 
                          onClick={() => setEditingLeadId(null)}
                          className="px-6 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-white rounded-lg text-sm font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(lead.id)}
                          disabled={isSaving}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditToggle(lead)}
                          className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          Edit Email
                        </button>
                        <button 
                          onClick={() => handleRegenerate(lead.id)}
                          disabled={isRegeneratingId === lead.id}
                          className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isRegeneratingId === lead.id ? 'Regenerating...' : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                              Regenerate AI
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-8 w-full">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Subs</p>
                        <p className="text-sm text-white font-mono">{lead.subscriberCount}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Views</p>
                        <p className="text-sm text-white font-mono">{lead.viewCount}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Avg. Views / Video</p>
                        <p className="text-sm text-white font-mono">
                          {Math.round((parseInt((lead.viewCount || '0').toString().replace(/,/g, '')) || 0) / (parseInt((lead.videoCount || '1').toString().replace(/,/g, '')) || 1)).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                      <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 ${getChannelInsight(lead).bg} ${getChannelInsight(lead).border}`}>
                        <span className={`flex items-center text-xs font-bold uppercase tracking-widest ${getChannelInsight(lead).color}`}>
                          {getChannelInsight(lead).icon}
                          {getChannelInsight(lead).text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-center mt-12 space-x-4">
              <button 
                onClick={() => setGeneratedLeads([])}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                Analyze More
              </button>
              <Link 
                href="/dashboard"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                Go to Campaign Dashboard
              </Link>
            </div>
          </div>
        )}

      </main>

      <footer className="p-8 text-center border-t border-white/5 mt-auto">
        <p className="text-zinc-700 text-[10px] uppercase font-bold tracking-[0.2em]">Automated Outreach v2.0</p>
      </footer>
    </div>
  );
}


