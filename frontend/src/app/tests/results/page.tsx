'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import { testsApi } from '../../../services/api';
import { formatTime } from '../../../utils/formatTime';
import { TestAttempt } from '../../../types';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen, 
  Home,
  AlertCircle
} from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const { data: history, isLoading, error } = useQuery<TestAttempt[]>({
    queryKey: ['testHistory'],
    queryFn: testsApi.getHistory,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const latestAttempt = history && history.length > 0 ? history[0] : null;

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: 'High', color: 'text-emerald-400' };
    if (score >= 70) return { label: 'Medium', color: 'text-amber-400' };
    return { label: 'Low', color: 'text-red-400' };
  };

  // Compute test duration
  const getDuration = (attempt: TestAttempt) => {
    if (!attempt.endTime) return 'N/A';
    const start = new Date(attempt.startTime).getTime();
    const end = new Date(attempt.endTime).getTime();
    return formatTime(Math.max(0, Math.round((end - start) / 1000)));
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Attempt Report Card</h1>
              <p className="text-zinc-400 text-sm mt-1">Real-time analysis and estimated GATE metrics</p>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 cursor-pointer w-fit"
            >
              <Home className="h-4.5 w-4.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-[300px] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-brand-500" />
                <span className="text-sm font-semibold text-zinc-500">Loading attempt scores...</span>
              </div>
            </div>
          ) : error || !latestAttempt ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center max-w-md mx-auto mt-10">
              <AlertCircle className="h-10 w-10 text-zinc-500 mx-auto mb-2" />
              <h3 className="font-bold text-zinc-200 text-base">No Test Attempt Found</h3>
              <p className="text-xs text-zinc-550 mt-1">You must first complete a Mock Test before viewing diagnostic reports.</p>
              <button
                onClick={() => router.push('/tests/start')}
                className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 cursor-pointer"
              >
                Go to Testing Portal
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Score Highlight Box */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-sm text-center">
                
                {latestAttempt.status === 'SUBMITTED' && (latestAttempt.violationsCount ?? 0) >= 3 && (
                  <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/15 p-4 flex gap-3 text-left text-xs text-red-400">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="text-red-200 text-sm block mb-1">Test Automatically Submitted</strong>
                      <p className="leading-relaxed">
                        This attempt was automatically submitted by the system because you exceeded the limit of 3 security violations (tab switching, fullscreen exiting, or losing window focus).
                      </p>
                    </div>
                  </div>
                )}

                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Latest Performance Score</span>
                
                <div className="flex items-baseline justify-center gap-1.5 mt-2">
                  <span className="text-6xl font-extrabold tracking-tight text-brand-500">
                    {latestAttempt.score ?? 0}
                  </span>
                  <span className="text-xl font-bold text-zinc-400">/ 12.00</span>
                </div>

                <p className="text-xs text-zinc-500 mt-1.5">Marks compiled using standard GATE marking schemes</p>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-zinc-800 pt-6 text-center">
                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Estimated AIR</span>
                    <p className="text-xl font-extrabold text-white mt-1">
                      {latestAttempt.rankEstimated ? `#${latestAttempt.rankEstimated}` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Percentile</span>
                    <p className="text-xl font-extrabold text-white mt-1">
                      {latestAttempt.percentile !== null ? `${latestAttempt.percentile}%` : 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Time Elapsed</span>
                    <p className="text-xl font-bold text-white mt-1">{getDuration(latestAttempt)}</p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Attempt Status</span>
                    <p className={`text-xl font-bold mt-1 ${latestAttempt.status === 'SUBMITTED' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {latestAttempt.status}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Violations Count</span>
                    <p className={`text-xl font-extrabold mt-1 ${latestAttempt.violationsCount >= 2 ? 'text-red-400' : latestAttempt.violationsCount === 1 ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {latestAttempt.violationsCount ?? 0} / 3
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Credibility Score</span>
                    <p className={`text-xl font-extrabold mt-1 ${(latestAttempt.credibilityScore ?? 100) >= 90 ? 'text-emerald-400' : (latestAttempt.credibilityScore ?? 100) >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {latestAttempt.credibilityScore ?? 100} %
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Confidence Level</span>
                    <p className={`text-xl font-extrabold mt-1 ${getConfidenceLevel(latestAttempt.credibilityScore ?? 100).color}`}>
                      {getConfidenceLevel(latestAttempt.credibilityScore ?? 100).label}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Exam Code</span>
                    <p className="text-xl font-bold text-white mt-1">{latestAttempt.exam?.code.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Concepts details review lists */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm">
                <h3 className="text-base font-bold text-white mb-4">Diagnostic Answer Keys</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  Review incorrect responses to feed details into your study tracker.
                </p>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex gap-3 text-xs text-zinc-450">
                  <Trophy className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    AI engine aggregates these results to highlight topic fluidity rates and update the <strong className="text-zinc-200">Radar Chart</strong> on your dashboard.
                  </p>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
