'use client';

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, GraduationCap, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export default function Navbar() {
  const { user, logoutUser, isAuthenticated } = useAuth();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700 transition cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
          <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          RANK<span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">FORGE</span>
        </span>
      </div>

      {isAuthenticated && user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 p-1.5 pr-3 border border-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-850 text-zinc-300 overflow-hidden border border-zinc-800">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4.5 w-4.5" />
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-zinc-200 leading-tight">{user.name}</p>
              <p className="text-[10px] text-zinc-400 leading-none">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 transition hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/40 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </header>
  );
}
