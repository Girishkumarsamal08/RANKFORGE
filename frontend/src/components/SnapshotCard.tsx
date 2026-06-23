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
    <div className={cn("rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 border border-zinc-100">
          <Icon className="h-5 w-5 text-brand-600" />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-zinc-900">{value}</h3>
        
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span className={cn(
                "font-semibold",
                trend.isPositive ? "text-emerald-600" : "text-red-500"
              )}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-zinc-400">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
