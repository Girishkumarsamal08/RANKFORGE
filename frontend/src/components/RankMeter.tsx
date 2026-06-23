'use client';

import React from 'react';
import { Trophy, Award, Sparkles, AlertCircle } from 'lucide-react';

interface RankMeterProps {
  rank: number | null;
}

export default function RankMeter({ rank }: RankMeterProps) {
  if (rank === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-805 bg-zinc-900/30 p-8 text-center text-zinc-500">
        <AlertCircle className="h-8 w-8 text-zinc-500 mb-2" />
        <h4 className="font-semibold text-zinc-300">No Rank Prediction Yet</h4>
        <p className="text-xs text-zinc-500 mt-1">Complete a mock test to calculate your rank.</p>
      </div>
    );
  }

  // Define status details based on rank
  const getRankStats = (r: number) => {
    if (r <= 100) {
      return {
        label: 'Top Ranker (AIR Under 100)',
        color: 'from-blue-600 to-indigo-600',
        bg: 'bg-blue-950/20 border-blue-900/40',
        text: 'text-blue-400',
        icon: Sparkles,
        tip: 'Excellent status. You qualify for prime IISc/IIT admissions and leading PSU call letters.',
      };
    }
    if (r <= 500) {
      return {
        label: 'Elite Category (AIR Under 500)',
        color: 'from-emerald-600 to-teal-600',
        bg: 'bg-emerald-950/20 border-emerald-900/40',
        text: 'text-emerald-400',
        icon: Trophy,
        tip: 'Strong position. High chance of securing your choice specialization at top-tier IITs.',
      };
    }
    if (r <= 2000) {
      return {
        label: 'Qualifying Standard (AIR Under 2000)',
        color: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-950/20 border-amber-900/40',
        text: 'text-amber-400',
        icon: Award,
        tip: 'Promising standing. Eligible for prime streams in major NITs and newer IITs.',
      };
    }
    return {
      label: 'Aspirant (AIR 2000+)',
      color: 'from-zinc-650 to-zinc-700',
      bg: 'bg-zinc-900/40 border-zinc-800/80',
      text: 'text-zinc-300',
      icon: Award,
      tip: 'Requires focus. Re-analyze mistakes on NAT topics and revise high-weightage subjects.',
    };
  };

  const stats = getRankStats(rank);
  const Icon = stats.icon;

  return (
    <div className={`rounded-2xl border p-6 ${stats.bg} transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stats.color} text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Predicted Rank Range</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h3 className="text-4xl font-extrabold tracking-tight text-white">
              AIR ~{rank}
            </h3>
            <span className="text-xs font-medium text-zinc-500">All India Rank</span>
          </div>

          <h4 className={`text-sm font-bold mt-2 ${stats.text}`}>{stats.label}</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{stats.tip}</p>
        </div>
      </div>

      {/* Progress Line */}
      <div className="mt-6">
        <div className="flex justify-between text-[10px] font-semibold text-zinc-500 uppercase">
          <span>AIR 1</span>
          <span>AIR 500</span>
          <span>AIR 2000</span>
          <span>AIR 5000+</span>
        </div>
        <div className="relative mt-1.5 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
          {/* Highlight ranges */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-zinc-650"
            style={{ width: '100%' }}
          />
          {/* Rank pointer representation */}
          <div 
            className="absolute top-0 h-full w-1.5 bg-zinc-950 border-x border-zinc-800 shadow-md"
            style={{ 
              left: `${Math.max(0, Math.min(99, rank <= 100 ? (rank / 100) * 10 : rank <= 500 ? 10 + ((rank - 100) / 400) * 30 : rank <= 2000 ? 40 + ((rank - 500) / 1500) * 30 : 70 + ((rank - 2000) / 8000) * 30))}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
