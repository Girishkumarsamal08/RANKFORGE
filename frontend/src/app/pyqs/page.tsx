'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { initTest } from '../../features/testSlice';
import { testsApi } from '../../services/api';
import { FileText, Download, Eye, AlertCircle, BookOpen, Play, Loader2, X, ShieldAlert, Award } from 'lucide-react';

export default function PYQLibraryPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [loadingYear, setLoadingYear] = useState<string | null>(null);
  
  // Modal configurations
  const [selectedYearForModal, setSelectedYearForModal] = useState<string | null>(null);
  const [selectedModeForModal, setSelectedModeForModal] = useState('full'); // 'ga', 'subject', 'full'

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const handleStartExam = async (year: string, mode: string) => {
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

    setLoadingYear(year);
    try {
      // Initialize GATE CS mock test with year and mode
      const response = await testsApi.start(`gate-cs-${year}-${mode}`);
      
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
      setLoadingYear(null);
      setSelectedYearForModal(null); // Close modal on complete
    }
  };

  if (!isAuthenticated) return null;

  const pyqPapers = [
    {
      year: '2025',
      title: 'GATE CS 2025 Master Question Paper',
      filename: 'gate-2025.pdf',
      size: '1.0 MB',
      description: 'The latest GATE Computer Science master question paper containing official keys and responses.'
    },
    {
      year: '2024',
      title: 'GATE CS 2024 Question Paper',
      filename: 'gate-2024.pdf',
      size: '815 KB',
      description: 'Official 2024 paper containing multi-select questions (MSQ) and numerical response segments.'
    },
    {
      year: '2023',
      title: 'GATE CS 2023 Paper (Part 1)',
      filename: 'gate-2023.pdf',
      size: '526 KB',
      description: 'Official 2023 computer science division mock test and actual paper segment.'
    },
    {
      year: '2022',
      title: 'GATE CS 2022 Paper (Part 1)',
      filename: 'gate-2022.pdf',
      size: '2.1 MB',
      description: 'Foundational systems and math segment paper containing high-yield computer architecture problems.'
    },
    {
      year: '2021',
      title: 'GATE CS 2021 Question Paper',
      filename: 'gate-2021.pdf',
      size: '2.0 MB',
      description: 'Official question paper covering discrete mathematics and complex compiler algorithms.'
    },
    {
      year: '2020',
      title: 'GATE CS 2020 Original Paper',
      filename: 'gate-2020.pdf',
      size: '2.5 MB',
      description: 'Comprehensive computer science syllabus paper including high-yield data structures problems.'
    }
  ];

  const getMetrics = () => {
    if (selectedModeForModal === 'ga') {
      return { qCount: '10 Qs', time: '30 Mins', marks: '15 Marks' };
    }
    if (selectedModeForModal === 'subject') {
      return { qCount: '55 Qs', time: '150 Mins', marks: '85 Marks' };
    }
    return { qCount: '65 Qs', time: '180 Mins', marks: '100 Marks' };
  };

  const modalMetrics = getMetrics();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full h-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="h-8 w-8 text-brand-500" />
              <span>GATE PYQ Library</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Access and download official GATE CS question papers from 2020 to 2025.
            </p>
          </div>

          {/* Advice Alert */}
          <div className="mb-6 rounded-xl border border-brand-900/30 bg-brand-950/15 p-4 flex gap-3 text-xs text-zinc-300">
            <AlertCircle className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Study Guide Tip</strong>
              <p className="leading-relaxed">
                Analyzing the last 5 years of GATE papers is the best way to verify topic weightages (General Aptitude: 15%, Math: 13%, Core CS: 72%) and identify high-yield chapters like graph algorithms, relational algebra, and CPU scheduling.
              </p>
            </div>
          </div>

          {/* Library Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pyqPapers.map((paper) => (
              <div 
                key={paper.year} 
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between shadow-sm hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs font-bold text-brand-400 border border-zinc-800">
                      GATE {paper.year}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Size: {paper.size}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{paper.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{paper.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-4 border-t border-zinc-800/85">
                  <div className="flex gap-2 flex-1">
                    <a
                      href={`/pyqs/${paper.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </a>
                    <a
                      href={`/pyqs/${paper.filename}`}
                      download
                      className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                  
                  <button
                    onClick={() => setSelectedYearForModal(paper.year)}
                    disabled={loadingYear !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Take Mock Exam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Segment Selection Modal */}
      {selectedYearForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
              <div>
                <span className="text-[10px] text-brand-400 font-extrabold uppercase tracking-widest">GATE CS {selectedYearForModal}</span>
                <h3 className="text-base font-bold text-white mt-0.5">Configure Your Mock Exam</h3>
              </div>
              <button 
                onClick={() => setSelectedYearForModal(null)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2.5">
                  Select Format Mode
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      id: 'ga',
                      title: 'General Aptitude (GA) Only',
                      sub: '10 Qs | 15 Marks | 30 Mins',
                      desc: 'Focus exclusively on the mandatory general aptitude segment.',
                    },
                    {
                      id: 'subject',
                      title: 'Subject-Specific Paper',
                      sub: '55 Qs | 85 Marks | 150 Mins',
                      desc: 'Focus on Engineering Mathematics & Core Computer Science subjects.',
                    },
                    {
                      id: 'full',
                      title: 'Full GATE Mock Exam',
                      sub: '65 Qs | 100 Marks | 180 Mins',
                      desc: 'Complete actual GATE CS question blueprint covering both sections.',
                    },
                  ].map((modeOpt) => (
                    <button
                      key={modeOpt.id}
                      onClick={() => setSelectedModeForModal(modeOpt.id)}
                      className={`p-3.5 rounded-xl border transition text-left cursor-pointer flex flex-col ${
                        selectedModeForModal === modeOpt.id
                          ? 'bg-brand-950/20 border-brand-500 text-white'
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-450 hover:border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold ${selectedModeForModal === modeOpt.id ? 'text-brand-400' : 'text-zinc-350'}`}>
                          {modeOpt.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${selectedModeForModal === modeOpt.id ? 'bg-brand-500/10 text-brand-350' : 'bg-zinc-950 text-zinc-500'}`}>
                          {modeOpt.sub}
                        </span>
                      </div>
                      <p className="text-[10px] mt-1.5 leading-relaxed font-medium">
                        {modeOpt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-3 gap-2.5 rounded-xl bg-zinc-900/30 p-3 border border-zinc-850 text-center text-xs font-bold text-zinc-300">
                <div>
                  <span className="text-[9px] text-zinc-550 block uppercase mb-0.5">Questions</span>
                  {modalMetrics.qCount}
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 block uppercase mb-0.5">Duration</span>
                  {modalMetrics.time}
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 block uppercase mb-0.5">Marks</span>
                  {modalMetrics.marks}
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 space-y-1.5">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Strict Monitoring</strong>: Fullscreen mode is mandatory. Leaving fullscreen or switching tabs logs warnings to the database.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Standard Marking</strong>: MCQs have 1/3 negative marks. MSQs and NATs carry no negative marking.
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleStartExam(selectedYearForModal, selectedModeForModal)}
                disabled={loadingYear !== null}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
              >
                {loadingYear !== null ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Unlocking exam space...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current shrink-0" />
                    <span>Start Mock Exam Attempt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
