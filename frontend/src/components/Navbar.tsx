'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logoutUser, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm">
          <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900">
          RANK<span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">FORGE</span>
        </span>
      </div>

      {isAuthenticated && user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-1.5 pr-3 border border-zinc-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-zinc-800 leading-tight">{user.name}</p>
              <p className="text-[10px] text-zinc-400 leading-none">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 hover:border-red-100"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </header>
  );
}
