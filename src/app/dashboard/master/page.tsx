'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MasterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else {
      fetchMasterLeads();
    }
  }, [user, router]);

  const fetchMasterLeads = async () => {
    const res = await fetch('/api/master/leads');
    if (res.ok) {
      setLeads(await res.json());
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Master Dashboard</h1>
      
      <div className="glass-card p-6 mb-8 flex justify-between items-center max-w-sm">
        <div>
          <h2 className="text-zinc-400 text-sm uppercase tracking-wider">Total Global Leads</h2>
          <p className="text-4xl font-bold text-white">{leads.length}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-white/5 text-zinc-400">
            <tr>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Scraped By</th>
              <th className="px-6 py-4">Tier</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                <td className="px-6 py-4 text-indigo-300">{lead.user?.username || 'Unknown'}</td>
                <td className="px-6 py-4">{lead.tier}</td>
                <td className="px-6 py-4">{lead.status}</td>
                <td className="px-6 py-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
