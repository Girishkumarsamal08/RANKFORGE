'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';

interface TestTimerProps {
  initialSeconds: number;
  onTimeout: () => void;
  onTick?: (elapsedSeconds: number) => void;
}

export default function TestTimer({ initialSeconds, onTimeout, onTick }: TestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeout();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        if (onTick) {
          const elapsed = initialSeconds - nextVal;
          onTick(elapsed);
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeout, onTick, initialSeconds]);

  const isLowTime = secondsLeft <= 300; // Under 5 minutes

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
      isLowTime
        ? "bg-red-950/30 text-red-400 border-red-900/50 animate-pulse"
        : "bg-zinc-900/80 text-zinc-300 border-zinc-800"
    )}>
      <Clock className="h-4 w-4" />
      <span>Time Remaining:</span>
      <span className="font-mono text-base">{formatTime(secondsLeft)}</span>
    </div>
  );
}
