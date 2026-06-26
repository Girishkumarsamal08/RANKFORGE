'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import { testsApi, analyticsApi } from '../../../services/api';
import { initTest } from '../../../features/testSlice';
import { DashboardAnalytics } from '../../../types';
import { FileText, Play, ShieldAlert, Award, Loader2, AlertTriangle } from 'lucide-react';

export default function StartTestPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMode, setSelectedMode] = useState('full'); // 'ga', 'subject', 'full'

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics'],
    queryFn: analyticsApi.getDashboard,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const handleStartExam = async () => {
    // Request fullscreen mode first
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        throw new Error('Fullscreen API not supported by browser.');
      }
    } catch (err) {
      alert('Fullscreen mode is mandatory to start the mock test. Please allow fullscreen permission.');
      return;
    }

    setLoading(true);
    try {
      // Initialize GATE CS mock test with the chosen configuration
      const response = await testsApi.start(`gate-cs-${selectedYear}-${selectedMode}`);
      
      // Dispatch payload to Redux store
      dispatch(initTest({
        attemptId: response.attemptId,
        questions: response.questions,
      }));

      // Direct to active attempt page
      router.push('/tests/attempt');
    } catch (error: any) {
      console.error('Failed to initiate mock test:', error);
      const msg = error.response?.data?.message || 'Error connecting to Server. Verify backend containers are running.';
      alert(msg);
      // Exit fullscreen if exam initialization failed
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  // Configuration metrics
  const getMetrics = () => {
    if (selectedMode === 'ga') {
      return { questionsCount: '10 Questions', timerLimit: '30 Minutes', maxMarks: '15.00 Marks' };
    }
    if (selectedMode === 'subject') {
      return { questionsCount: '55 Questions', timerLimit: '150 Minutes', maxMarks: '85.00 Marks' };
    }
    return { questionsCount: '65 Questions', timerLimit: '180 Minutes', maxMarks: '100.00 Marks' };
  };

  const metrics = getMetrics();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full h-full">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">GATE Diagnostic Portal</h1>
            <p className="text-zinc-400 text-sm mt-1">Select and configure your active testing workspace.</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm overflow-hidden">
            <div className="bg-brand-600 p-6 text-white flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-200">Customizable Assessment Builder</span>
                <h2 className="text-xl font-bold mt-0.5">GATE Computer Science (CS) Mock Exam</h2>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Year Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-450 uppercase tracking-widest block mb-3">
                  Select Exam Reference Year (PYQ Source)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['2025', '2024', '2023', '2022', '2021', '2020'].map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        selectedYear === year
                          ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/20'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      GATE {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-450 uppercase tracking-widest block mb-3">
                  Select Exam Format / Segment
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'ga',
                      title: 'General Aptitude (GA)',
                      desc: '10 questions (15 marks) covering compulsory verbal & numerical reasoning.',
                    },
                    {
                      id: 'subject',
                      title: 'Subject Paper',
                      desc: '55 questions (85 marks) covering Engineering Math and Core CS subjects.',
                    },
                    {
                      id: 'full',
                      title: 'Full Mock Exam',
                      desc: '65 questions (100 marks) combining GA and Subject sections for complete actual exam experience.',
                    },
                  ].map((modeOpt) => (
                    <button
                      key={modeOpt.id}
                      onClick={() => setSelectedMode(modeOpt.id)}
                      className={`p-4 rounded-xl border transition text-left cursor-pointer flex flex-col h-full ${
                        selectedMode === modeOpt.id
                          ? 'bg-brand-950/20 border-brand-500 text-white'
                          : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <span className={`text-xs font-extrabold uppercase mb-1 tracking-wider ${selectedMode === modeOpt.id ? 'text-brand-400' : 'text-zinc-500'}`}>
                        {modeOpt.title}
                      </span>
                      <p className="text-[11px] leading-relaxed font-medium mt-1">
                        {modeOpt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Info Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Questions</span>
                  <p className="text-xl font-bold text-white mt-1">{metrics.questionsCount}</p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Timer Limit</span>
                  <p className="text-xl font-bold text-white mt-1">{metrics.timerLimit}</p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-4 border border-zinc-850 text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Simulated Max Marks</span>
                  <p className="text-xl font-bold text-white mt-1">{metrics.maxMarks}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider">Instructions & Rules</h3>
                
                <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-200">Anti-Cheat Active</strong>: Swapping tabs, exiting fullscreen, or minimizing the browser window triggers warning logs sent directly to the AI engine. Keep focus on the test window.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Award className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-zinc-200">GATE Marking Standard</strong>: MCQs have 1/3 negative marking. MSQs and NATs do not have negative marks. NAT questions require keyboard input values.
                    </span>
                  </div>
                </div>
              </div>

              {/* Button Action */}
              <div className="border-t border-zinc-800 pt-6">
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer w-full md:w-auto"
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

          {/* GATE Exam Weightage Blueprint Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* General Aptitude */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Part 1 (Syllabus)</span>
                <span className="rounded-lg bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 text-xs font-extrabold text-emerald-400">15% Marks</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">General Aptitude</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Verbal (grammar, comprehension), Quantitative (data, probability), Analytical (logic), and Spatial (transformations, patterns).
              </p>
              <div className="space-y-1.5 text-[10px] text-zinc-300 font-medium">
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Verbal Reasoning & Grammar</span>
                  <span className="text-zinc-400 font-mono">~4-5%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Quantitative Aptitude</span>
                  <span className="text-zinc-400 font-mono">~4-5%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Analytical Logic & Reasoning</span>
                  <span className="text-zinc-400 font-mono">~3-4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Spatial Transformations</span>
                  <span className="text-zinc-400 font-mono">~2-3%</span>
                </div>
              </div>
            </div>

            {/* Engineering Mathematics */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Part 2 (Syllabus)</span>
                <span className="rounded-lg bg-brand-950/40 border border-brand-900/40 px-2 py-0.5 text-xs font-extrabold text-brand-400">13% Marks</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Engineering Mathematics</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Discrete Math (logic, graph theory, sets), Linear Algebra, Calculus (limits, integration), and Probability & Statistics.
              </p>
              <div className="space-y-1.5 text-[10px] text-zinc-300 font-medium">
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Discrete Mathematics</span>
                  <span className="text-zinc-400 font-mono">~5-6%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Linear Algebra (Matrices, Eigenvalues)</span>
                  <span className="text-zinc-400 font-mono">~3-4%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1.5">
                  <span>Probability & Statistics</span>
                  <span className="text-zinc-400 font-mono">~3-4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Calculus (Limits, Continuity)</span>
                  <span className="text-zinc-400 font-mono">~1-2%</span>
                </div>
              </div>
            </div>

            {/* Core Computer Science */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Part 3 (Syllabus)</span>
                <span className="rounded-lg bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 text-xs font-extrabold text-amber-400">72% Marks</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Core CS Subjects</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Programming, Data Structures, Algorithms, TOC, Operating Systems, Databases, Computer Networks, COA, Digital Logic, and Compiler.
              </p>
              <div className="space-y-1.5 text-[10px] text-zinc-300 font-medium">
                <div className="flex justify-between border-b border-zinc-850/80 pb-1">
                  <span>Programming & Data Structures</span>
                  <span className="text-zinc-400 font-mono">~10-12%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1">
                  <span>Algorithms (Greedy, Dynamic)</span>
                  <span className="text-zinc-400 font-mono">~10-12%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1">
                  <span>TOC, Parsing & Compiler</span>
                  <span className="text-zinc-400 font-mono">~12-14%</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850/80 pb-1">
                  <span>OS & Databases (SQL, Normal Forms)</span>
                  <span className="text-zinc-400 font-mono">~16-18%</span>
                </div>
                <div className="flex justify-between">
                  <span>Networks (TCP/IP), COA & Logic</span>
                  <span className="text-zinc-400 font-mono">~18-20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weak Topics Analysis Table */}
          {analyticsLoading ? (
            <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 mt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <span className="text-xs font-semibold text-zinc-500 animate-pulse">Loading topic-wise diagnostics...</span>
              </div>
            </div>
          ) : analytics ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm mt-6">
              <h3 className="text-base font-bold text-zinc-100 mb-1">Concept Vulnerabilities</h3>
              <p className="text-xs text-zinc-450 mb-5">Ranked by accuracy and review priority</p>

              {analytics.weakTopics.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/45 max-w-xl mx-auto my-2">
                  <AlertTriangle className="h-7 w-7 text-amber-500/80 mx-auto mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-zinc-200 mb-1.5">No Diagnostic Data Available</h4>
                  <p className="text-xs text-zinc-450 leading-relaxed">
                    Concept Vulnerabilities tracks your accuracy and average solving speed across core GATE subjects (Engineering Mathematics, General Aptitude, and Computer Science) to pinpoint weak areas. Attempt a test above to begin loading topic-wise diagnostics.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Subject / Module</th>
                        <th className="pb-3">Sub-Topic</th>
                        <th className="pb-3">Accuracy</th>
                        <th className="pb-3">Avg Solve Speed</th>
                        <th className="pb-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {analytics.weakTopics.map((item, idx) => (
                        <tr key={idx} className="text-zinc-300">
                          <td className="py-3.5 font-medium">{item.subject}</td>
                          <td className="py-3.5 text-zinc-400">{item.topic}</td>
                          <td className="py-3.5">
                            <span className="font-semibold text-zinc-100">{Math.round(item.accuracy * 100)}%</span>
                          </td>
                          <td className="py-3.5 text-zinc-400">{item.average_time_seconds} seconds</td>
                          <td className="py-3.5">
                            <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold border ${
                              item.recommendation_priority === 'HIGH'
                                ? 'bg-red-950/20 text-red-400 border-red-900/40'
                                : item.recommendation_priority === 'MEDIUM'
                                ? 'bg-amber-950/20 text-amber-400 border-amber-900/40'
                                : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40'
                            }`}>
                              {item.recommendation_priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
