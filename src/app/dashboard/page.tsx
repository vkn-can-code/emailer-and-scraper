'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProcessedChannel } from '@/types';
import StatsBar from '@/components/StatsBar';
import ResultsTable from '@/components/ResultsTable';
import ExportButtons from '@/components/ExportButtons';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import Link from 'next/link';

export default function DashboardPage() {
  const [channels, setChannels] = useState<ProcessedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const { logout } = useAuth();
  const { showToast } = useToast();

  const fetchLeads = useCallback(async (date: Date | null) => {
    setIsLoading(true);
    try {
      let url = '/api/leads';
      if (date) {
        url += `?date=${date.toISOString()}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setChannels(data);
      } else {
        showToast('Failed to fetch leads', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLeads(selectedDate);
  }, [selectedDate, fetchLeads]);

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setChannels(prev => prev.filter(c => c.id !== id));
        showToast('Lead deleted successfully', 'success');
      } else {
        showToast('Failed to delete lead', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  const handleUpdateLead = (updatedLead: ProcessedChannel) => {
    setChannels(prev => prev.map(c => c.id === updatedLead.id ? updatedLead : c));
  };



  return (
    <div className="min-h-screen bg-transparent text-white p-8 relative">
      <header className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Campaign Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">View and manage your analyzed creators and generated outreach.</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={logout}
            className="text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em] mr-2"
          >
            Sign Out
          </button>

          <Link 
            href="/"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-inner"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Analysis
          </Link>
          
          <ExportButtons channels={channels} selectedDate={selectedDate} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <StatsBar channels={channels} />
          <ResultsTable channels={channels} onDelete={handleDeleteLead} onUpdate={handleUpdateLead} />
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <CalendarWidget onDateSelect={handleDateSelect} selectedDate={selectedDate} />
          
          {selectedDate && (
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 relative z-10">Current Filter</h3>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-indigo-400 font-bold tracking-wide">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => handleDateSelect(null)}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold tracking-widest transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}


        </aside>
      </div>
    </div>
  );
}
