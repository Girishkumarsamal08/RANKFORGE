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
      label: 'Performance Analysis',
      href: '/tests/results',
      icon: BarChart2,
    },
  ];

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-zinc-200 bg-white p-4 md:flex">
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
                  ? "bg-brand-50 text-brand-600 font-semibold"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4.5 w-4.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Aspirant Goal</span>
        </div>
        <p className="text-xs text-zinc-500 leading-normal">
          GATE Paper: <strong>Computer Science (CS)</strong>
        </p>
        <p className="text-[10px] text-zinc-400 mt-1">
          Aiming for Top IITs & Premium PSUs.
        </p>
      </div>
    </aside>
  );
}
