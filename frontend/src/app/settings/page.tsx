'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { User, Award, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const GATE_BRANCHES = [
  { code: 'AE', name: 'Aerospace Engineering (AE)' },
  { code: 'AG', name: 'Agricultural Engineering (AG)' },
  { code: 'AR', name: 'Architecture and Planning (AR)' },
  { code: 'BM', name: 'Biomedical Engineering (BM)' },
  { code: 'BT', name: 'Biotechnology (BT)' },
  { code: 'CE', name: 'Civil Engineering (CE)' },
  { code: 'CH', name: 'Chemical Engineering (CH)' },
  { code: 'CS', name: 'Computer Science and Engineering (CS)' },
  { code: 'DA', name: 'Data Science and Artificial Intelligence (DA)' },
  { code: 'EC', name: 'Electronics and Communication Engineering (EC)' },
  { code: 'EE', name: 'Electrical Engineering (EE)' },
  { code: 'ES', name: 'Environmental Science and Engineering (ES)' },
  { code: 'EY', name: 'Ecology and Evolution (EY)' },
  { code: 'GE', name: 'Geomatics Engineering (GE)' },
  { code: 'GG', name: 'Geology and Geophysics (GG)' },
  { code: 'IN', name: 'Instrumentation Engineering (IN)' },
  { code: 'MA', name: 'Mathematics (MA)' },
  { code: 'ME', name: 'Mechanical Engineering (ME)' },
  { code: 'MN', name: 'Mining Engineering (MN)' },
  { code: 'MT', name: 'Metallurgical Engineering (MT)' },
  { code: 'NM', name: 'Naval Architecture and Marine Engineering (NM)' },
  { code: 'PE', name: 'Petroleum Engineering (PE)' },
  { code: 'PH', name: 'Physics (PH)' },
  { code: 'PI', name: 'Production and Industrial Engineering (PI)' },
  { code: 'ST', name: 'Statistics (ST)' },
  { code: 'TF', name: 'Textile Engineering and Fibre Science (TF)' },
  { code: 'XE', name: 'Engineering Sciences (XE)' },
  { code: 'XH', name: 'Humanities and Social Sciences (XH)' },
  { code: 'XL', name: 'Life Sciences (XL)' }
];

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user, token, loginUser } = useAuth();

  const [name, setName] = useState('');
  const [branch, setBranch] = useState('CS');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user) {
      setName(user.name);
      setBranch(user.branch || 'CS');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await authApi.updateProfile({ name, branch });
      
      // Update Redux Credentials & LocalStorage
      loginUser(response.user, response.token);
      
      setSuccess('Profile updated successfully! Personalizing your workspace...');
      setTimeout(() => {
        setSuccess(null);
      }, 4000);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update profile settings.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-2xl mx-auto w-full h-full">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Profile Settings</h1>
            <p className="text-zinc-400 text-sm mt-1">Configure your candidate details and active target GATE paper.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 md:p-8 shadow-xl shadow-black/20 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Icon and Header */}
              <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-650/10 text-brand-400 border border-brand-500/20">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-zinc-450">{user.email}</p>
                </div>
              </div>

              {success && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-950/20 p-4 border border-emerald-900/40 text-xs font-semibold text-emerald-400 animate-fade-in">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-950/20 p-4 border border-red-900/40 text-xs font-semibold text-red-400 animate-fade-in">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Primary GATE Paper</label>
                  <div className="relative">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1em'
                      }}
                    >
                      {GATE_BRANCHES.map((b) => (
                        <option key={b.code} value={b.code} className="bg-zinc-950 text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                    Changing your target paper will instantly customize the diagnostic mock test catalog, blueprint metrics, Weak Topic radar charts, and AI Mentor advice.
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Profile Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
