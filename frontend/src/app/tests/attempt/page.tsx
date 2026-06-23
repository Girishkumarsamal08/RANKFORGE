'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import Navbar from '../../../components/Navbar';
import TestTimer from '../../../components/TestTimer';
import QuestionPalette from '../../../components/QuestionPalette';
import { testsApi } from '../../../services/api';
import { 
  selectAnswer, 
  clearAnswer, 
  incrementTimeSpent, 
  setCurrentQuestionIndex,
  incrementCheatCount,
  resetTestState
} from '../../../features/testSlice';
import { AlertCircle, HelpCircle, Save, Square } from 'lucide-react';

export default function TestAttemptPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { attemptId, questions, currentQuestionIndex, answers, timesSpent, cheatEventsCount } = useSelector(
    (state: RootState) => state.test
  );

  const [submitting, setSubmitting] = useState(false);
  const [natValue, setNatValue] = useState('');
  const [isFsActive, setIsFsActive] = useState(true);

  // Fullscreen state checker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkFs = () => {
      setIsFsActive(!!document.fullscreenElement);
    };
    checkFs();
    document.addEventListener('fullscreenchange', checkFs);
    return () => document.removeEventListener('fullscreenchange', checkFs);
  }, []);

  const triggerFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to trigger fullscreen:', err);
      });
    }
  };

  // 1. Redirect if no active attempt
  useEffect(() => {
    if (!attemptId || questions.length === 0) {
      router.replace('/tests/start');
    }
  }, [attemptId, questions, router]);

  // 2. Track question-specific solve times in seconds
  useEffect(() => {
    if (!attemptId || questions.length === 0) return;

    const currentQ = questions[currentQuestionIndex];
    const timer = setInterval(() => {
      dispatch(incrementTimeSpent({ questionId: currentQ.id, seconds: 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, attemptId, questions, dispatch]);

  // Sync NAT input values on question navigation
  useEffect(() => {
    if (questions.length > 0) {
      const q = questions[currentQuestionIndex];
      if (q.type === 'NAT') {
        setNatValue(answers[q.id] || '');
      }
    }
  }, [currentQuestionIndex, questions, answers]);

  // 3. Anti-Cheat Monitoring (Visibility, Focus & Fullscreen)
  useEffect(() => {
    if (!attemptId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        dispatch(incrementCheatCount());
        console.warn('User switched tabs during active mock test attempt.');
        try {
          await testsApi.logCheat({
            attemptId,
            eventType: 'TAB_SWITCH',
            details: 'Tab switched or browser minimized during testing session.',
          });
        } catch (e) {
          console.error(e);
        }
        alert('Warning: Tab switching is monitored. This event has been logged for evaluation.');
      }
    };

    const handleWindowBlur = async () => {
      dispatch(incrementCheatCount());
      try {
        await testsApi.logCheat({
          attemptId,
          eventType: 'FOCUS_LOST',
          details: 'Window lost focus (clicked on desktop/other app).',
        });
      } catch (e) {
        console.error(e);
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        dispatch(incrementCheatCount());
        try {
          await testsApi.logCheat({
            attemptId,
            eventType: 'FULLSCREEN_EXIT',
            details: 'User exited fullscreen mode during the active attempt.',
          });
        } catch (e) {
          console.error(e);
        }
        alert('Warning: Fullscreen mode is mandatory for this GATE mock. Exiting fullscreen has been logged.');
      }
    };

    // Try to request fullscreen on mount (best effort)
    const requestFs = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log('Programmatic fullscreen request blocked. Needs user click.', err);
      }
    };
    requestFs();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Clean up fullscreen mode when leaving the test
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [attemptId, dispatch]);

  if (!attemptId || questions.length === 0) return null;

  const currentQ = questions[currentQuestionIndex];

  // MCQ Selection handler
  const handleSelectOption = (idx: number) => {
    dispatch(selectAnswer({ questionId: currentQ.id, answerSelected: String(idx) }));
  };

  // MSQ Checkbox toggling handler
  const handleSelectCheckbox = (idx: number) => {
    const currentVal = answers[currentQ.id] || '';
    let selectedIndices = currentVal ? currentVal.split(',') : [];

    if (selectedIndices.includes(String(idx))) {
      selectedIndices = selectedIndices.filter(i => i !== String(idx));
    } else {
      selectedIndices.push(String(idx));
    }

    dispatch(selectAnswer({
      questionId: currentQ.id,
      answerSelected: selectedIndices.sort().join(','),
    }));
  };

  // NAT Save Value handler
  const handleSaveNat = () => {
    dispatch(selectAnswer({ questionId: currentQ.id, answerSelected: natValue }));
  };

  const handleClear = () => {
    if (currentQ.type === 'NAT') {
      setNatValue('');
    }
    dispatch(clearAnswer(currentQ.id));
  };

  // Submits payload
  const handleSubmitTest = async (auto = false) => {
    if (!auto && !window.confirm('Are you sure you want to end the test and submit?')) {
      return;
    }

    setSubmitting(true);
    try {
      // Map Redux answers map into standard server payload format
      const formattedAnswers = Object.keys(timesSpent).map((qId) => ({
        questionId: qId,
        answerSelected: answers[qId] || '',
        timeSpentSeconds: timesSpent[qId] || 0,
      }));

      const result = await testsApi.submit({
        attemptId,
        answers: formattedAnswers,
      });

      console.log('Test submitted successfully:', result);
      
      // Navigate to results report card
      router.push('/tests/results');
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Error submitting answers. Verify backend connection.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 select-none">
      <Navbar />

      {!isFsActive && (
        <div className="flex w-full items-center justify-between bg-amber-500 px-6 py-2 text-xs font-bold text-white border-b border-amber-600 animate-pulse">
          <span>Anti-Cheat Notice: Fullscreen mode is mandatory for this mock test.</span>
          <button
            onClick={triggerFullscreen}
            className="rounded-lg bg-zinc-950 px-3 py-1.5 font-extrabold hover:bg-zinc-900 transition cursor-pointer"
          >
            Restore Fullscreen
          </button>
        </div>
      )}

      {/* Test Workspace Header */}
      <div className="flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-100">
            {currentQ.subject}
          </span>
          <span className="text-xs font-medium text-zinc-400">/</span>
          <span className="text-xs font-semibold text-zinc-600">{currentQ.topic}</span>
        </div>

        <div className="flex items-center gap-4">
          <TestTimer initialSeconds={1800} onTimeout={() => handleSubmitTest(true)} />
          
          {cheatEventsCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <span>Warnings: {cheatEventsCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Side: Question Pane */}
        <main className="flex-1 p-6 md:p-8">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm min-h-[450px]">
            <div>
              {/* Question Meta */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
                <span className="text-sm font-bold text-zinc-500">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Type: {currentQ.type}
                </span>
              </div>

              {/* Question Content */}
              <h2 className="text-base md:text-lg font-semibold text-zinc-900 leading-relaxed mb-8">
                {currentQ.text}
              </h2>

              {/* Answer Inputs based on Question type */}
              <div className="space-y-3.5 max-w-xl">
                {currentQ.type === 'MCQ' && (
                  currentQ.options.map((opt, idx) => {
                    const isSelected = answers[currentQ.id] === String(idx);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 text-brand-700 font-semibold'
                            : 'border-zinc-100 bg-zinc-50/20 hover:border-zinc-300'
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-zinc-300 text-zinc-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span>{opt}</span>
                      </button>
                    );
                  })
                )}

                {currentQ.type === 'MSQ' && (
                  currentQ.options.map((opt, idx) => {
                    const selectedList = answers[currentQ.id]?.split(',') || [];
                    const isSelected = selectedList.includes(String(idx));

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectCheckbox(idx)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 text-brand-700 font-semibold'
                            : 'border-zinc-100 bg-zinc-50/20 hover:border-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4.5 w-4.5 rounded text-brand-600 border-zinc-300"
                        />
                        <span>{opt}</span>
                      </button>
                    );
                  })
                )}

                {currentQ.type === 'NAT' && (
                  <div className="space-y-3">
                    <span className="text-xs text-zinc-400 font-medium leading-none">Enter your numerical answer:</span>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="number"
                        step="any"
                        value={natValue}
                        onChange={(e) => setNatValue(e.target.value)}
                        placeholder="0.00"
                        className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                      <button
                        onClick={handleSaveNat}
                        className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 text-xs font-bold text-white transition hover:bg-zinc-950 cursor-pointer"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-6 mt-10">
              <div className="flex gap-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>

              <button
                onClick={handleClear}
                className="rounded-xl border border-dashed border-red-200 bg-red-50/20 px-4.5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:border-red-300 cursor-pointer"
              >
                Clear Response
              </button>
            </div>
          </div>
        </main>

        {/* Right Side: Sidebar Navigation Palette */}
        <aside className="w-80 border-l border-zinc-200 bg-white p-6 flex flex-col justify-between h-[calc(100vh-3.5rem-4rem)]">
          <QuestionPalette
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            onSelectQuestion={(idx) => dispatch(setCurrentQuestionIndex(idx))}
          />

          <button
            onClick={() => handleSubmitTest(false)}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <Square className="h-4.5 w-4.5 shrink-0" />
            <span>{submitting ? 'Submitting attempt...' : 'Finish & Submit Test'}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
