'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import { testsApi } from '../../../services/api';
import { initTest } from '../../../features/testSlice';
import { FileText, Play, ShieldAlert, Award, Loader2 } from 'lucide-react';

export default function StartTestPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const handleStartExam = async () => {
    setLoading(true);
    try {
      // Initialize GATE CS mock test
      const response = await testsApi.start('gate-cs-2026');
      
      // Dispatch payload to Redux store
      dispatch(initTest({
        attemptId: response.attemptId,
        questions: response.questions,
      }));

      // Direct to active attempt page
      router.push('/tests/attempt');
    } catch (error) {
      console.error('Failed to initiate mock test:', error);
      alert('Error connecting to Server. Verify backend containers are running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">GATE Diagnostic Portal</h1>
            <p className="text-zinc-500 text-sm mt-1">Select and configure your active testing workspace.</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-brand-600 p-6 text-white flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-200">Featured Mock Assessment</span>
                <h2 className="text-xl font-bold mt-0.5">GATE Computer Science (CS) - Diagnostics 1</h2>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Exam Info Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Questions</span>
                  <p className="text-xl font-bold text-zinc-800 mt-1">6 Modules</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Timer Limit</span>
                  <p className="text-xl font-bold text-zinc-800 mt-1">30 Minutes</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 text-center">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Simulated Max Marks</span>
                  <p className="text-xl font-bold text-zinc-800 mt-1">12.00</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">Instructions & Rules</h3>
                
                <div className="space-y-2 text-xs text-zinc-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Anti-Cheat Active</strong>: Swapping tabs, exiting fullscreen, or minimizing the browser window triggers warning logs sent directly to the AI engine. Keep focus on the test window.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Award className="h-4.5 w-4.5 text-zinc-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>GATE Marking Standard</strong>: MCQs have 1/3 negative marking. MSQs and NATs do not have negative marks. NAT questions require keyboard input values.
                    </span>
                  </div>
                </div>
              </div>

              {/* Button Action */}
              <div className="border-t border-zinc-100 pt-6">
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-100 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer w-full md:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Unlocking workspace...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4.5 w-4.5 shrink-0" />
                      <span>Start Assessed Attempt</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
