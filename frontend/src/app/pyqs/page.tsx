'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { initTest } from '../../features/testSlice';
import { testsApi } from '../../services/api';
import { FileText, Download, Eye, AlertCircle, BookOpen, Play, Loader2 } from 'lucide-react';

export default function PYQLibraryPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [loadingYear, setLoadingYear] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const handleStartExam = async (year: string) => {
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
      // Initialize GATE CS mock test
      const response = await testsApi.start(`gate-cs-${year}`);
      
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
                    onClick={() => handleStartExam(paper.year)}
                    disabled={loadingYear !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {loadingYear === paper.year ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        <span>Take Mock Exam</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
