'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, BarChart2, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'GATE Mock Tests',
      href: '/tests/start',
      icon: FileText,
    },
    {
      label: 'GATE PYQs',
      href: '/pyqs',
      icon: BookOpen,
    },
    {
      label: 'Performance Analysis',
      href: '/tests/results',
      icon: BarChart2,
    },
  ];

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-zinc-800/60 bg-zinc-950/40 p-4 md:flex backdrop-blur-md">
      <div className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('/').slice(0, 3).join('/')));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-brand-500/10 text-brand-400 font-semibold border-l-2 border-brand-500 rounded-none pl-3.5"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl bg-zinc-900/40 p-4 border border-zinc-800/60">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4.5 w-4.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Aspirant Goal</span>
        </div>
        <p className="text-xs text-zinc-400 leading-normal">
          GATE Paper: <strong className="text-zinc-200">Computer Science (CS)</strong>
        </p>
        <p className="text-[10px] text-zinc-500 mt-1">
          Aiming for Top IITs & Premium PSUs.
        </p>
      </div>
    </aside>
  );
}
