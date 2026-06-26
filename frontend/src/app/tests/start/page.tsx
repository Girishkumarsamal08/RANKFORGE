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
  const [activeLoadingKey, setActiveLoadingKey] = useState<string | null>(null);
  
  const [selectedYear, setSelectedYear] = useState('2025');

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

  const handleStartExam = async (branch: string, mode: string) => {
    const key = `${branch}-${mode}`;
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
    setActiveLoadingKey(key);
    try {
      // Initialize GATE mock test with the chosen configuration
      const response = await testsApi.start(`gate-${branch}-${selectedYear}-${mode}`);
      
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
      setActiveLoadingKey(null);
    }
  };

  const renderExamCard = (
    branch: string,
    mode: string,
    title: string,
    questionsCount: string,
    timerLimit: string,
    maxMarks: string,
    description: string
  ) => {
    const key = `${branch}-${mode}`;
    const isThisLoading = loading && activeLoadingKey === key;
    
    return (
      <div className="flex flex-col h-full rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition shadow-sm justify-between">
        <div>
          <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">{mode === 'ga' ? 'Aptitude' : mode === 'subject' ? 'Core Subject' : 'Comprehensive'}</span>
          <h3 className="text-base font-bold text-white mt-1 mb-2">{title}</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{description}</p>
          
          <div className="space-y-1.5 text-[10px] text-zinc-300 font-mono mb-6 bg-zinc-950/40 rounded-xl p-3 border border-zinc-850">
            <div className="flex justify-between">
              <span className="text-zinc-500 font-sans">Questions:</span>
              <span className="font-semibold text-white">{questionsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-sans">Time Limit:</span>
              <span className="font-semibold text-white">{timerLimit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-sans">Max Marks:</span>
              <span className="font-semibold text-white">{maxMarks}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleStartExam(branch, mode)}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-700 transition disabled:opacity-50 cursor-pointer w-full"
        >
          {isThisLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Unlocking...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span>Start Assessed Attempt</span>
            </>
          )}
        </button>
      </div>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full h-full">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">GATE Diagnostic Portal</h1>
            <p className="text-zinc-400 text-sm mt-1">Select your paper and configure your active testing workspace.</p>
          </div>

          {/* Year Selection Section */}
          <div className="mb-8 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
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

          {/* Instructions banner */}
          <div className="mb-8 p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/20 text-xs text-zinc-400 space-y-2.5">
            <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider mb-2 text-zinc-350">Diagnostic Test Instructions & Rules</h3>
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

          {/* Exam Section: Computer Science */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">GATE Computer Science (CS)</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Algorithms, OS, Databases, Computer Networks, Discrete Math, and more.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderExamCard('cs', 'ga', 'General Aptitude (GA)', '10 Questions', '30 Minutes', '15.00 Marks', '10 compulsory questions covering verbal, quantitative, analytical, and spatial reasoning.')}
              {renderExamCard('cs', 'subject', 'Subject Paper (CS)', '55 Questions', '150 Minutes', '85.00 Marks', '55 questions covering Engineering Mathematics and core Computer Science subjects.')}
              {renderExamCard('cs', 'full', 'Full Mock Exam (CS)', '65 Questions', '180 Minutes', '100.00 Marks', '65 questions combining both GA and core CS sections for the complete actual exam experience.')}
            </div>
          </div>

          {/* Exam Section: Electronics & Communication */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">GATE Electronics & Communication (EC)</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Network Theory, Signals & Systems, Analog & Digital Circuits, Electromagnetics, and more.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderExamCard('ec', 'ga', 'General Aptitude (GA)', '10 Questions', '30 Minutes', '15.00 Marks', '10 compulsory questions covering verbal, quantitative, analytical, and spatial reasoning.')}
              {renderExamCard('ec', 'subject', 'Subject Paper (EC)', '55 Questions', '150 Minutes', '85.00 Marks', '55 questions covering Engineering Mathematics and core Electronics & Communication subjects.')}
              {renderExamCard('ec', 'full', 'Full Mock Exam (EC)', '65 Questions', '180 Minutes', '100.00 Marks', '65 questions combining both GA and core EC sections for the complete actual exam experience.')}
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
