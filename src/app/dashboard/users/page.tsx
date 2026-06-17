'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    } else {
      fetchUsers();
    }
  }, [user, router]);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
    });
    
    if (res.ok) {
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create user');
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>
      
      <div className="glass-card p-6 mb-8 max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Username</label>
            <input 
              type="text" 
              required
              value={newUsername} 
              onChange={e => setNewUsername(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" 
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white" 
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Role</label>
            <select 
              value={newRole} 
              onChange={e => setNewRole(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors">
            Create User
          </button>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-xs uppercase bg-white/5 text-zinc-400">
            <tr>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-medium text-white">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
