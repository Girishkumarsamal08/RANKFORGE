'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { GraduationCap, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      loginUser(response.user, response.token);
      router.push('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        setError(data.errors[0].message);
      } else if (data?.message) {
        setError(data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Please ensure the backend is running.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />
      
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/45 p-8 shadow-2xl shadow-black/40 backdrop-blur-lg">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 overflow-hidden items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md">
              <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
            <p className="mt-1.5 text-sm text-zinc-400">Sign in to your RANKFORGE account to study</p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-950/20 p-3.5 border border-red-900/40 text-xs font-medium text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Logging you in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="h-4.5 w-4.5" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            <span>New aspirant? </span>
            <Link href="/register" className="font-bold text-brand-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
