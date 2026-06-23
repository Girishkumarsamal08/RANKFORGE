'use client';

import React from 'react';
import { Question } from '../types';
import { cn } from '../lib/utils';

interface QuestionPaletteProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentQuestionIndex,
  answers,
  onSelectQuestion,
}: QuestionPaletteProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4">
        Question Navigation
      </h3>

      <div className="grid grid-cols-5 gap-2.5">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold border transition-all cursor-pointer",
                isCurrent 
                  ? "ring-2 ring-brand-500 border-brand-500 font-bold" 
                  : "",
                isAnswered
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className="mt-6 border-t border-zinc-100 pt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4.5 w-4.5 rounded-lg bg-emerald-50 border border-emerald-200" />
          <span className="text-zinc-600 font-medium">Answered / Saved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4.5 w-4.5 rounded-lg bg-zinc-50 border border-zinc-200" />
          <span className="text-zinc-600 font-medium">Unattempted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4.5 w-4.5 rounded-lg border-2 border-brand-500 bg-white" />
          <span className="text-zinc-600 font-medium">Current Active Question</span>
        </div>
      </div>
    </div>
  );
}
