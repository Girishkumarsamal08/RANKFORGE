import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface SnapshotCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export default function SnapshotCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: SnapshotCardProps) {
  return (
    <div className={cn("rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-md transition hover:bg-zinc-900/60 hover:border-zinc-700/80 hover:shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-zinc-300 border border-zinc-850/80">
          <Icon className="h-5 w-5 text-brand-500" />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
        
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span className={cn(
                "font-semibold",
                trend.isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-zinc-500">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
