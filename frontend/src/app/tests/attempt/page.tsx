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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [natValue, setNatValue] = useState('');
  const [isFsActive, setIsFsActive] = useState(true);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [serverViolationsCount, setServerViolationsCount] = useState(0);
  const [serverCredibilityScore, setServerCredibilityScore] = useState(100);

  const handleViolation = async (eventType: string, details: string) => {
    if (submitting || !attemptId) return;

    // Map Redux answers map into standard server payload format
    const formattedAnswers = Object.keys(timesSpent).map((qId) => ({
      questionId: qId,
      answerSelected: answers[qId] || '',
      timeSpentSeconds: timesSpent[qId] || 0,
    }));

    try {
      const response = await testsApi.logCheat({
        attemptId,
        eventType,
        details,
        answers: formattedAnswers,
      });

      const { autoSubmitted, violationsCount, credibilityScore } = response;
      setServerViolationsCount(violationsCount);
      setServerCredibilityScore(credibilityScore);

      if (autoSubmitted) {
        setWarningMessage('Critical security violation! You have exceeded the maximum of 3 violations. Your test attempt is being automatically submitted.');
        setShowWarningModal(true);
        setSubmitting(true);
        setTimeout(() => {
          router.push('/tests/results');
        }, 3000);
      } else {
        if (violationsCount === 1) {
          setWarningMessage(`Warning: ${details} This is violation 1 of 3. Please maintain fullscreen and browser focus.`);
          setShowWarningModal(true);
        } else if (violationsCount === 2) {
          setWarningMessage(`Final Warning: ${details} This is violation 2 of 3. One more violation will cause automatic submission of your test.`);
          setShowWarningModal(true);
        }
      }
    } catch (e) {
      console.error('Failed to log cheat event:', e);
    }
  };

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
        await handleViolation('TAB_SWITCH', 'Tab switched or browser minimized during testing session.');
      }
    };

    const handleWindowBlur = async () => {
      dispatch(incrementCheatCount());
      await handleViolation('WINDOW_BLUR', 'Window lost focus (clicked on desktop/other app).');
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        dispatch(incrementCheatCount());
        await handleViolation('FULLSCREEN_EXIT', 'User exited fullscreen mode during the active attempt.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [attemptId, answers, timesSpent, submitting]);

  // 4. Fetch initial remaining time from server and synchronize periodically
  useEffect(() => {
    if (!attemptId) return;

    const syncTime = async () => {
      try {
        const response = await testsApi.getRemainingTime(attemptId);
        if (response.isExpired) {
          setSubmitting(true);
          alert('Your test duration has expired. Redirecting to results.');
          router.push('/tests/results');
        } else {
          setSecondsRemaining(response.remainingSeconds);
        }
      } catch (err: any) {
        console.error('Failed to sync remaining time:', err);
      }
    };

    syncTime();

    // Periodically sync time with server every 15 seconds
    const syncInterval = setInterval(syncTime, 15000);

    return () => clearInterval(syncInterval);
  }, [attemptId, router]);

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
    setSubmitError(null);
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
    } catch (error: any) {
      console.error('Failed to submit test:', error);
      const msg = error.response?.data?.message || 'Submission encountered an issue.';
      setSubmitError(msg);
      // Still navigate to results after a brief delay — the history API will show the latest data
      setTimeout(() => router.push('/tests/results'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent select-none">
      <Navbar />

      {!isFsActive && (
        <div className="flex w-full items-center justify-between bg-amber-600/90 backdrop-blur px-6 py-2 text-xs font-bold text-white border-b border-amber-800 animate-pulse">
          <span>Anti-Cheat Notice: Fullscreen mode is mandatory for this mock test.</span>
          <button
            onClick={triggerFullscreen}
            className="rounded-lg bg-zinc-950 px-3 py-1.5 font-extrabold hover:bg-zinc-900 transition cursor-pointer"
          >
            Restore Fullscreen
          </button>
        </div>
      )}

      {/* Submit Error Banner */}
      {submitError && (
        <div className="flex w-full items-center gap-2 bg-red-950/30 border-b border-red-900/40 px-6 py-2 text-xs font-bold text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{submitError} — Redirecting to results...</span>
        </div>
      )}

      {/* Test Workspace Header */}
      <div className="flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-400 border border-brand-900/30">
            {currentQ.subject}
          </span>
          <span className="text-xs font-medium text-zinc-650">/</span>
          <span className="text-xs font-semibold text-zinc-300">{currentQ.topic}</span>
        </div>

        <div className="flex items-center gap-4">
          <TestTimer initialSeconds={secondsRemaining !== null ? secondsRemaining : 1800} onTimeout={() => handleSubmitTest(true)} />
          
          {serverViolationsCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-950/30 px-3 py-1.5 text-xs font-bold text-amber-400 border border-amber-900/40 animate-pulse">
              <AlertCircle className="h-4 w-4" />
              <span>Warnings: {serverViolationsCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Side: Question Pane */}
        <main className="flex-1 p-6 md:p-8">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm min-h-[450px]">
            <div>
              {/* Question Meta */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <span className="text-sm font-bold text-zinc-400">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                  Type: {currentQ.type}
                </span>
              </div>

              {/* Question Content */}
              <h2 className="text-base md:text-lg font-semibold text-white leading-relaxed mb-8">
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
                            ? 'border-brand-500 bg-brand-500/10 text-brand-300 font-semibold'
                            : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 hover:bg-zinc-950/50 text-zinc-350'
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-zinc-700 text-zinc-450'
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
                            ? 'border-brand-500 bg-brand-500/10 text-brand-300 font-semibold'
                            : 'border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 hover:bg-zinc-950/50 text-zinc-350'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-4.5 w-4.5 rounded text-brand-500 border-zinc-700 bg-zinc-950"
                        />
                        <span>{opt}</span>
                      </button>
                    );
                  })
                )}

                {currentQ.type === 'NAT' && (
                  <div className="space-y-3">
                    <span className="text-xs text-zinc-450 font-medium leading-none">Enter your numerical answer:</span>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="number"
                        step="any"
                        value={natValue}
                        onChange={(e) => setNatValue(e.target.value)}
                        placeholder="0.00"
                        className="rounded-xl border border-zinc-800 bg-zinc-950/60 text-white px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-zinc-900"
                      />
                      <button
                        onClick={handleSaveNat}
                        className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 text-xs font-bold text-white transition hover:bg-zinc-700 cursor-pointer"
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
            <div className="flex items-center justify-between border-t border-zinc-800 pt-6 mt-10">
              <div className="flex gap-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 px-4 py-2.5 text-xs font-bold transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 px-4 py-2.5 text-xs font-bold transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>

              <button
                onClick={handleClear}
                className="rounded-xl border border-dashed border-red-900/40 bg-red-950/20 px-4.5 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-950/40 hover:border-red-900/60 cursor-pointer"
              >
                Clear Response
              </button>
            </div>
          </div>
        </main>

        {/* Right Side: Sidebar Navigation Palette */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-950/60 p-6 flex flex-col justify-between h-[calc(100vh-3.5rem-4rem)]">
          <QuestionPalette
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            onSelectQuestion={(idx) => dispatch(setCurrentQuestionIndex(idx))}
          />

          <button
            onClick={() => handleSubmitTest(false)}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
          >
            <Square className="h-4.5 w-4.5 shrink-0" />
            <span>{submitting ? 'Submitting attempt...' : 'Finish & Submit Test'}</span>
          </button>
        </aside>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-center gap-3 text-red-500 mb-4">
              <AlertCircle className="h-8 w-8 animate-bounce" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Security Violation Detected</h3>
            </div>
            
            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              {warningMessage}
            </p>

            <div className="flex flex-col gap-2 rounded-xl bg-zinc-900/60 p-4 border border-zinc-800 mb-6 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Violations Count:</span>
                <span className="font-bold text-red-400">{serverViolationsCount} / 3</span>
              </div>
              <div className="flex justify-between">
                <span>Credibility Score:</span>
                <span className="font-bold text-brand-400">{serverCredibilityScore} %</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowWarningModal(false);
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-98 shadow-lg shadow-red-900/20 cursor-pointer text-center"
            >
              I Understand & Resume Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
