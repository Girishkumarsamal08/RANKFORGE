'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, BarChart2, BookOpen, HelpCircle, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../hooks/useAuth';

const BRANCH_NAMES: Record<string, string> = {
  AE: 'Aerospace Eng. (AE)',
  AG: 'Agricultural Eng. (AG)',
  AR: 'Architecture & Planning (AR)',
  BM: 'Biomedical Eng. (BM)',
  BT: 'Biotechnology (BT)',
  CE: 'Civil Eng. (CE)',
  CH: 'Chemical Eng. (CH)',
  CS: 'Computer Science (CS)',
  DA: 'Data Science & AI (DA)',
  EC: 'Electronics & Comm. (EC)',
  EE: 'Electrical Eng. (EE)',
  ES: 'Environmental Sci. (ES)',
  EY: 'Ecology & Evolution (EY)',
  GE: 'Geomatics Eng. (GE)',
  GG: 'Geology & Geophysics (GG)',
  IN: 'Instrumentation Eng. (IN)',
  MA: 'Mathematics (MA)',
  ME: 'Mechanical Eng. (ME)',
  MN: 'Mining Eng. (MN)',
  MT: 'Metallurgical Eng. (MT)',
  NM: 'Naval Arch. & Marine (NM)',
  PE: 'Petroleum Eng. (PE)',
  PH: 'Physics (PH)',
  PI: 'Production & Industrial (PI)',
  ST: 'Statistics (ST)',
  TF: 'Textile Eng. (TF)',
  XE: 'Engineering Sciences (XE)',
  XH: 'Humanities & Social (XH)',
  XL: 'Life Sciences (XL)'
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const { user } = useAuth();

  useEffect(() => {
    // Automatically close sidebar on mobile when navigating
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };
    handleResize(); // call initially
  }, [pathname, setIsOpen]);

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
    {
      label: 'Profile Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      label: 'About RANKFORGE',
      href: '/about',
      icon: HelpCircle,
    },
  ];

  const userBranch = user?.branch || 'CS';
  const branchDisplayName = BRANCH_NAMES[userBranch] || `${userBranch} Paper`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 z-20 bg-zinc-950/60 backdrop-blur-sm md:hidden cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:static top-16 bottom-0 left-0 z-30 flex h-[calc(100vh-4rem)] flex-col bg-zinc-950/95 md:bg-zinc-950/40 transition-all duration-300 ease-in-out border-zinc-800/60 overflow-hidden",
        isOpen 
          ? "w-64 opacity-100 border-r p-4 translate-x-0 pointer-events-auto" 
          : "w-0 opacity-0 border-r-0 p-0 pointer-events-none -translate-x-full md:translate-x-0"
      )}>
        <div className="flex-1 space-y-1 w-56">
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

        <div className="rounded-2xl bg-zinc-900/40 p-4 border border-zinc-800/60 w-56">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4.5 w-4.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Aspirant Goal</span>
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            GATE Paper: <strong className="text-zinc-200">{branchDisplayName}</strong>
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Aiming for Top IITs & Premium PSUs.
          </p>
        </div>
      </aside>
    </>
  );
}
