'use client';

import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  MessageSquare,
  Send,
  Bot
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleAskAdvisor = async (queryText: string) => {
    if (!queryText.trim() || chatLoading) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const response = await analyticsApi.collegeAdvisor(queryText);
      setChatResponse(response.recommendation);
    } catch (err: any) {
      setChatResponse("### ❌ Error\n\nFailed to receive response from College Advisor. Please verify that the backend server is online.");
    } finally {
      setChatLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-1.5">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-semibold text-brand-400 mt-3 mb-1.5">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('* ')) {
        const cleanLine = line.replace('* ', '');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-zinc-300 leading-relaxed mb-1"
              dangerouslySetInnerHTML={{ __html: cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-zinc-950 px-1 rounded text-brand-400 font-mono">$1</code>') }}
          />
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      
      const formatted = line
        .replace(/\*\frac/g, '') // strip potential LaTeX glitches
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-zinc-950 px-1.5 py-0.5 rounded text-brand-400 font-mono text-[10px]">$1</code>');
      return (
        <p key={idx} className="text-xs text-zinc-300 leading-relaxed mb-1.5"
           dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

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
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full h-full">
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
                  value={analytics.stats.currentRank ? `AIR ~${analytics.stats.currentRank}` : 'N/A'}
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
                  
                  {/* AI GATE College Admissions Advisor Chat Panel */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Bot className="h-5 w-5 text-brand-400" />
                        <h3 className="text-base font-bold text-white">AI GATE College Admissions Advisor</h3>
                      </div>
                      
                      <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                        Ask our AI expert about college admission referrals, minimum GATE scores, and where you stand for IISc, IITs, NITs, and other premier engineering institutes in India based on your mock exam history.
                      </p>

                      {/* Prompt suggestion chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button 
                          onClick={() => { setChatQuery("Which college can I refer to?"); handleAskAdvisor("Which college can I refer to?"); }}
                          className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-zinc-800/80 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                        >
                          🔍 "Which college can I refer to?"
                        </button>
                        <button 
                          onClick={() => { setChatQuery("Can I get into IITs with my current average score?"); handleAskAdvisor("Can I get into IITs with my current average score?"); }}
                          className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-zinc-800/80 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                        >
                          🏫 "What about IITs?"
                        </button>
                        <button 
                          onClick={() => { setChatQuery("What NIT options do I have?"); handleAskAdvisor("What NIT options do I have?"); }}
                          className="rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-bold text-zinc-400 border border-zinc-800/80 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                        >
                          ⚡ "What about NITs?"
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Chat input box */}
                      <form onSubmit={(e) => { e.preventDefault(); handleAskAdvisor(chatQuery); }} className="flex gap-2">
                        <input
                          type="text"
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          placeholder="e.g. which college can I refer to with my marks?"
                          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-brand-500/20"
                        />
                        <button
                          type="submit"
                          disabled={chatLoading || !chatQuery.trim()}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>

                      {/* Advisor response container */}
                      {chatLoading && (
                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 flex items-center justify-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-brand-500" />
                          <span className="text-xs font-bold text-zinc-400 animate-pulse">Evaluating cutoffs and referencing colleges...</span>
                        </div>
                      )}

                      {chatResponse && (
                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-5 shadow-inner border-l-2 border-l-brand-500 max-h-[160px] overflow-y-auto animate-fade-in">
                          {renderMarkdown(chatResponse)}
                        </div>
                      )}
                    </div>
                  </div>
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
