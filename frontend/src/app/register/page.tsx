'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import { GraduationCap, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [branch, setBranch] = useState('CS');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !branch) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.register({ name, email, password, branch });
      router.push('/login?registered=true');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        setError(data.errors[0].message);
      } else if (data?.message) {
        setError(data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Please ensure the backend is running.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />
      
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-8 shadow-2xl shadow-black/40 backdrop-blur-lg my-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 overflow-hidden items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md">
              <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Create Account</h2>
            <p className="mt-1.5 text-sm text-zinc-400">Sign up to begin mock testing and rank predictions</p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-950/20 p-3.5 border border-red-900/40 text-xs font-medium text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aspirant Name"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aspirant@rankforge.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">GATE Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
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

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-zinc-400" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-zinc-400" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer mt-6"
            >
              <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              {!loading && <ArrowRight className="h-4.5 w-4.5" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            <span>Already have an account? </span>
            <Link href="/login" className="font-bold text-brand-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
