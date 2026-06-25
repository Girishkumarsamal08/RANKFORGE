'use client';

import React from 'react';
import { 
  Flame, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';

interface RankMeterProps {
  rank: number | null;
}

export default function RankMeter({ rank }: RankMeterProps) {
  // We can customize the roadmap/recommendations based on the projected standing
  const getRoadmapData = (r: number | null) => {
    if (r && r <= 500) {
      return {
        standing: 'Elite Tier',
        standingColor: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
        progress: 88,
        streak: 12,
        tasks: [
          { id: 1, text: 'Solve 10 advanced NAT questions on Algorithms & Discrete Math', done: true },
          { id: 2, text: 'Analyze last full-length mock test incorrect questions', done: false },
          { id: 3, text: 'Revise key formulas for Computer Networks (IP Subnetting)', done: false },
        ],
        focusMessage: 'You are in a prime position. Shift focus entirely to full-length mocks and speed optimization to break into the Top 100.'
      };
    }
    
    if (r && r <= 2000) {
      return {
        standing: 'Competitive Tier',
        standingColor: 'text-brand-400 border-brand-500/20 bg-brand-950/20',
        progress: 78,
        streak: 7,
        tasks: [
          { id: 1, text: 'Practice DBMS transaction scheduling NAT questions', done: true },
          { id: 2, text: 'Review Weak Topic: TOC Regular Expressions (Accuracy: 48%)', done: false },
          { id: 3, text: 'Attempt Subject Mock: Operating Systems (Memory Management)', done: false },
        ],
        focusMessage: 'Solid progress. Aim to turn your medium-accuracy topics (40-60%) into strengths to secure an elite rank.'
      };
    }

    // Default roadmap for aspirants (AIR 2000+ or no rank)
    return {
      standing: 'Standard Tier',
      standingColor: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
      progress: 62,
      streak: 5,
      tasks: [
        { id: 1, text: 'Practice Numerical Answer Type (NAT) questions (25% weightage)', done: true },
        { id: 2, text: 'Review Weak Topic: Computer Networks (TCP/UDP protocols)', done: false },
        { id: 3, text: 'Attempt 30-min Mini Mock on Data Structures', done: false },
      ],
      focusMessage: 'Focus on high-weightage subjects and NAT questions where negative marking does not apply. Re-analyze mock mistakes.'
    };
  };

  const data = getRoadmapData(rank);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div>
        {/* Header with Title and Streak */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Smart Prep Roadmap</h3>
            <p className="text-[11px] text-zinc-400">Personalized milestones based on mocks</p>
          </div>
          
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-950/15 px-3 py-1.5 text-orange-400">
            <Flame className="h-4.5 w-4.5 fill-current" />
            <span className="text-xs font-bold">{data.streak} Day Streak</span>
          </div>
        </div>

        {/* Syllabus Progress */}
        <div className="mb-6 rounded-xl bg-zinc-950/40 p-4 border border-zinc-850">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <BookOpen className="h-4 w-4 text-brand-400" />
              <span>Syllabus Covered</span>
            </div>
            <span className="font-bold text-brand-400">{data.progress}%</span>
          </div>
          
          <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
            <span>Core CS: 75%</span>
            <span>Math & Aptitude: 45%</span>
          </div>
        </div>

        {/* Daily Action Plan */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Daily Focus Tasks
          </span>
          
          {data.tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                task.done 
                  ? 'border-zinc-800/40 bg-zinc-900/10 opacity-60' 
                  : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700/60'
              }`}
            >
              <CheckCircle2 className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${
                task.done ? 'text-zinc-500 fill-zinc-800' : 'text-zinc-500'
              }`} />
              <span className={`text-xs ${task.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                {task.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Strategy Insight */}
      <div className="mt-5 pt-4 border-t border-zinc-800/60 flex gap-2.5 items-start">
        <TrendingUp className="h-4.5 w-4.5 text-brand-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-normal">
          <strong className="text-zinc-300 font-semibold">Strategy: </strong>
          {data.focusMessage}
        </p>
      </div>
    </div>
  );
}
