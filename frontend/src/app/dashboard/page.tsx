'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import SnapshotCard from '../../components/SnapshotCard';
import RadarChart from '../../components/RadarChart';
import RankMeter from '../../components/RankMeter';
import { analyticsApi } from '../../services/api';
import { DashboardAnalytics } from '../../types';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const { data: analytics, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics'],
    queryFn: analyticsApi.getDashboard,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Welcome, {user.name}!
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Here is your GATE preparation diagnostics overview.
              </p>
            </div>
            
            <button
              onClick={() => router.push('/tests/start')}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 cursor-pointer w-fit"
            >
              <span>Attempt Mini-Mock</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-[400px] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-brand-500" />
                <span className="text-sm font-semibold text-zinc-500">Loading analysis reports...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
              <h3 className="font-bold text-zinc-200 text-base">Analytics Loading</h3>
              <p className="text-sm text-zinc-500 mt-1">Your dashboard analytics will appear here once the data pipeline is ready.</p>
              <button
                onClick={() => router.push('/tests/start')}
                className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 cursor-pointer"
              >
                Take a Mock Test
              </button>
            </div>
          ) : analytics ? (
            <div className="space-y-8 animate-fade-in">
              
              {/* KPI Section */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <SnapshotCard
                  title="Mock Tests Attempted"
                  value={analytics.stats.totalTests}
                  icon={BookOpen}
                  description="Completed tests count"
                />
                <SnapshotCard
                  title="Average Score"
                  value={`${analytics.stats.avgScore}%`}
                  icon={TrendingUp}
                  description="Out of 100 simulated marks"
                />
                <SnapshotCard
                  title="Highest Score"
                  value={`${analytics.stats.maxScore}%`}
                  icon={Trophy}
                  description="Peak performance metric"
                />
                <SnapshotCard
                  title="Estimated AIR"
                  value={analytics.stats.currentRank ? `#${analytics.stats.currentRank}` : 'N/A'}
                  icon={Target}
                  description="Projected All India Rank"
                />
              </div>

              {/* Visualization Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Pane - Radar Chart */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm lg:col-span-7">
                  <h3 className="text-base font-bold text-zinc-100 mb-2">Topic Accuracy Breakdown</h3>
                  <p className="text-xs text-zinc-450 mb-6">Visual mapping of accuracy strengths in core GATE modules</p>
                  
                  <div className="flex items-center justify-center p-4">
                    <RadarChart 
                      data={analytics.weakTopics.map(item => ({
                        topic: item.topic,
                        accuracy: item.accuracy
                      }))}
                    />
                  </div>
                </div>

                {/* Right Pane - Rank Meter */}
                <div className="flex flex-col gap-6 lg:col-span-5">
                  <RankMeter rank={analytics.stats.currentRank} />
                  
                  {/* Smart Score Insights */}
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      <h4 className="font-bold text-zinc-100 text-sm">Smart Score Insights</h4>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-400 leading-normal">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-400 font-bold">•</span>
                        <span>Answered questions correctly within 90 seconds are marked as <strong>High Fluidity</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-400 font-bold">•</span>
                        <span>Multiple tab switches during tests flags anti-cheat log alerts. Keep attempts clean!</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Weak Topics Analysis Table */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm">
                <h3 className="text-base font-bold text-zinc-100 mb-1">Concept Vulnerabilities</h3>
                <p className="text-xs text-zinc-400 mb-5">Ranked by accuracy and review priority</p>

                {analytics.weakTopics.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                    Attempt a test paper to load topic-wise diagnostics.
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

              {/* Actionable Recommendations Panel */}
              <div className="rounded-2xl border border-brand-900/30 bg-brand-950/15 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-bold text-white">RAG AI Learning Recommendations</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 rounded-xl bg-zinc-900/50 p-4 border border-zinc-800/80 shadow-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-950/40 text-brand-400 text-xs font-bold border border-brand-900/20">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              No analytics reports generated yet. Take a test above to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
