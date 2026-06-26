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
import { FileText, Play, ShieldAlert, Award, Loader2, AlertTriangle, BookOpen } from 'lucide-react';

const GATE_BRANCH_MAP: Record<string, string> = {
  AE: 'Aerospace Engineering (AE)',
  AG: 'Agricultural Engineering (AG)',
  AR: 'Architecture and Planning (AR)',
  BM: 'Biomedical Engineering (BM)',
  BT: 'Biotechnology (BT)',
  CE: 'Civil Engineering (CE)',
  CH: 'Chemical Engineering (CH)',
  CS: 'Computer Science and Engineering (CS)',
  DA: 'Data Science and Artificial Intelligence (DA)',
  EC: 'Electronics and Communication Engineering (EC)',
  EE: 'Electrical Engineering (EE)',
  ES: 'Environmental Science and Engineering (ES)',
  EY: 'Ecology and Evolution (EY)',
  GE: 'Geomatics Engineering (GE)',
  GG: 'Geology and Geophysics (GG)',
  IN: 'Instrumentation Engineering (IN)',
  MA: 'Mathematics (MA)',
  ME: 'Mechanical Engineering (ME)',
  MN: 'Mining Engineering (MN)',
  MT: 'Metallurgical Engineering (MT)',
  NM: 'Naval Architecture and Marine Engineering (NM)',
  PE: 'Petroleum Engineering (PE)',
  PH: 'Physics (PH)',
  PI: 'Production and Industrial Engineering (PI)',
  ST: 'Statistics (ST)',
  TF: 'Textile Engineering and Fibre Science (TF)',
  XE: 'Engineering Sciences (XE)',
  XH: 'Humanities and Social Sciences (XH)',
  XL: 'Life Sciences (XL)'
};

const BRANCH_BLUEPRINTS: Record<string, Array<{ name: string; weight: string }>> = {
  CS: [
    { name: 'Programming & Data Structures', weight: '~10-12%' },
    { name: 'Algorithms (Greedy, Dynamic)', weight: '~10-12%' },
    { name: 'TOC, Parsing & Compiler', weight: '~12-14%' },
    { name: 'OS & Databases (SQL, Normal Forms)', weight: '~16-18%' },
    { name: 'Networks (TCP/IP), COA & Logic', weight: '~18-20%' }
  ],
  EC: [
    { name: 'Network Theory', weight: '~10-12%' },
    { name: 'Signals & Systems', weight: '~10-12%' },
    { name: 'Electronic Devices & Analog Circuits', weight: '~14-16%' },
    { name: 'Digital Circuits & Control Systems', weight: '~16-18%' },
    { name: 'Communications & Electromagnetics', weight: '~18-20%' }
  ],
  DA: [
    { name: 'Probability and Statistics', weight: '15-18%' },
    { name: 'Linear Algebra & Calculus', weight: '12-15%' },
    { name: 'Programming, DS and Algorithms', weight: '15-20%' },
    { name: 'Databases & Machine Learning', weight: '20-25%' },
    { name: 'Artificial Intelligence', weight: '10-15%' }
  ]
};

const BRANCH_SUBJECT_TOPICS: Record<string, string[]> = {
  AE: ['Aerodynamics', 'Flight Mechanics', 'Space Dynamics', 'Propulsion', 'Aerospace Structures'],
  AG: ['Farm Machinery', 'Soil and Water Conservation', 'Agricultural Processing', 'Hydrology'],
  AR: ['Architecture Design', 'Building Materials', 'Urban Planning', 'Housing & Infrastructure'],
  BM: ['Biomedical Instrumentation', 'Biomaterials', 'Biomechanics', 'Medical Imaging Systems'],
  BT: ['Recombinant DNA Technology', 'Bioinformatics', 'Bioprocess Engineering', 'Microbiology'],
  CE: ['Structural Engineering', 'Geotechnical Engineering', 'Water Resources', 'Environmental Engineering', 'Transportation'],
  CH: ['Process Calculations', 'Fluid Mechanics & Mechanical Operations', 'Heat Transfer', 'Mass Transfer', 'Chemical Reaction Engineering'],
  EE: ['Electric Circuits', 'Electromagnetic Fields', 'Signals & Systems', 'Electrical Machines', 'Power Systems', 'Control Systems', 'Power Electronics'],
  ES: ['Environmental Chemistry', 'Environmental Microbiology', 'Water Supply & Wastewater', 'Solid Waste Management', 'Air & Noise Pollution'],
  EY: ['Ecology', 'Evolutionary Biology', 'Behavioral Ecology', 'Systematics & Biogeography'],
  GE: ['Remote Sensing', 'GIS', 'GPS & GNSS', 'Surveying & Photogrammetry'],
  GG: ['Earth and Planetary System', 'Geology', 'Geophysics', 'Structural Geology', 'Seismology'],
  IN: ['Sensors & Industrial Instrumentation', 'Optical Instrumentation', 'Signals & Systems', 'Control Systems', 'Measurements'],
  MA: ['Algebra', 'Real Analysis', 'Complex Analysis', 'Functional Analysis', 'Numerical Analysis'],
  ME: ['Applied Mechanics & Design', 'Fluid Mechanics & Thermal Sciences', 'Manufacturing & Industrial Engineering'],
  MN: ['Mine Development & Surveying', 'Geomechanics & Ground Control', 'Mining Methods & Systems', 'Mine Ventilation'],
  MT: ['Thermodynamics & Kinetics', 'Physical Metallurgy', 'Mechanical Metallurgy', 'Extraction Metallurgy'],
  NM: ['Ship Design', 'Hydrostatics & Stability', 'Ship Structures', 'Ship Resistance & Propulsion'],
  PE: ['Petroleum Exploration', 'Drilling Engineering', 'Production Operations', 'Reservoir Engineering'],
  PH: ['Mathematical Physics', 'Classical Mechanics', 'Electromagnetic Theory', 'Quantum Mechanics', 'Thermodynamics & Statistical Physics'],
  PI: ['General Engineering', 'Manufacturing Processes', 'Operational Research', 'Quality & Reliability'],
  ST: ['Probability', 'Stochastic Processes', 'Statistical Inference', 'Multivariate Analysis', 'Regression Analysis'],
  TF: ['Textile Fibres', 'Yarn Manufacture', 'Fabric Manufacture', 'Chemical Processing of Textiles'],
  XE: ['Fluid Mechanics', 'Materials Science', 'Solid Mechanics', 'Thermodynamics'],
  XH: ['Economics', 'English Linguistics', 'Philosophy', 'Psychology', 'Sociology'],
  XL: ['Biochemistry', 'Botany', 'Microbiology', 'Zoology', 'Food Technology']
};

export default function StartTestPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeLoadingKey, setActiveLoadingKey] = useState<string | null>(null);
  
  const [selectedYear, setSelectedYear] = useState('2025');
  const [activeBranch, setActiveBranch] = useState('CS');

  useEffect(() => {
    if (user?.branch) {
      setActiveBranch(user.branch);
    }
  }, [user]);

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

  const handleStartExam = async (branchCode: string, mode: string) => {
    const key = `${branchCode}-${mode}`;
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
      const response = await testsApi.start(`gate-${branchCode.toLowerCase()}-${selectedYear}-${mode}`);
      
      dispatch(initTest({
        attemptId: response.attemptId,
        questions: response.questions,
      }));

      router.push('/tests/attempt');
    } catch (error: any) {
      console.error('Failed to initiate mock test:', error);
      const msg = error.response?.data?.message || 'Error connecting to Server. Verify backend containers are running.';
      alert(msg);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } finally {
      setLoading(false);
      setActiveLoadingKey(null);
    }
  };

  const renderExamCard = (
    branchCode: string,
    mode: string,
    title: string,
    questionsCount: string,
    timerLimit: string,
    maxMarks: string,
    description: string
  ) => {
    const key = `${branchCode}-${mode}`;
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
          onClick={() => handleStartExam(branchCode, mode)}
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

  const getDynamicBlueprints = (branchCode: string) => {
    if (BRANCH_BLUEPRINTS[branchCode]) {
      return BRANCH_BLUEPRINTS[branchCode];
    }
    const topics = BRANCH_SUBJECT_TOPICS[branchCode] || ['Core Principles', 'Core Applications', 'Core Systems'];
    const equalWeight = Math.round(72 / topics.length);
    return topics.map((t) => ({
      name: t,
      weight: `~${equalWeight}%`
    }));
  };

  if (!isAuthenticated) return null;

  const branchFullName = GATE_BRANCH_MAP[activeBranch] || `${activeBranch} Paper`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full h-full">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">GATE Diagnostic Portal</h1>
              <p className="text-zinc-400 text-sm mt-1">Select your paper and configure your active testing workspace.</p>
            </div>
            
            {/* Branch selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-semibold uppercase">View Paper:</span>
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {Object.entries(GATE_BRANCH_MAP).map(([code, name]) => (
                  <option key={code} value={code} className="bg-zinc-950">
                    {name}
                  </option>
                ))}
              </select>
            </div>
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

          {/* Exam Section */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">GATE {branchFullName}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Custom mock testing workspace for {branchFullName.split(' (')[0]}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderExamCard(
                activeBranch,
                'ga',
                'General Aptitude (GA)',
                '10 Questions',
                '30 Minutes',
                '15.00 Marks',
                `10 compulsory questions covering verbal, quantitative, analytical, and spatial reasoning for ${activeBranch}.`
              )}
              {renderExamCard(
                activeBranch,
                'subject',
                `Subject Paper (${activeBranch})`,
                '55 Questions',
                '150 Minutes',
                '85.00 Marks',
                `55 questions covering Engineering Mathematics and core ${activeBranch} syllabus topics.`
              )}
              {renderExamCard(
                activeBranch,
                'full',
                `Full Mock Exam (${activeBranch})`,
                '65 Questions',
                '180 Minutes',
                '100.00 Marks',
                `65 questions combining both GA and core ${activeBranch} sections for the complete actual exam experience.`
              )}
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

            {/* Core Subject Blueprint */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Part 3 (Syllabus)</span>
                <span className="rounded-lg bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 text-xs font-extrabold text-amber-400">72% Marks</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Core {activeBranch} Syllabus</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Key subject weightages and core specifications for target GATE paper {activeBranch}.
              </p>
              <div className="space-y-1.5 text-[10px] text-zinc-300 font-medium">
                {getDynamicBlueprints(activeBranch).map((bp, idx) => (
                  <div key={idx} className={`flex justify-between ${idx < getDynamicBlueprints(activeBranch).length - 1 ? 'border-b border-zinc-850/80 pb-1' : ''}`}>
                    <span>{bp.name}</span>
                    <span className="text-zinc-400 font-mono">{bp.weight}</span>
                  </div>
                ))}
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
              <p className="text-xs text-zinc-455 mb-5">Ranked by accuracy and review priority</p>

              {analytics.weakTopics.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/45 max-w-xl mx-auto my-2">
                  <AlertTriangle className="h-7 w-7 text-amber-500/80 mx-auto mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-zinc-200 mb-1.5">No Diagnostic Data Available</h4>
                  <p className="text-xs text-zinc-455 leading-relaxed">
                    Concept Vulnerabilities tracks your accuracy and average solving speed across core GATE subjects (Engineering Mathematics, General Aptitude, and {activeBranch}) to pinpoint weak areas. Attempt a test above to begin loading topic-wise diagnostics.
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
