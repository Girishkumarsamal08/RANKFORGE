'use client';

import React, { createContext, useContext, useState } from 'react';

type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // We default to true on desktop-like widths if we want, or false.
  // Actually, keeping it open by default on desktop/laptop size and togglable, 
  // and closed by default on mobile size, is the standard practice.
  // Let's start with isOpen = false on initial render, and on desktop the user can open/close it.
  // Wait, let's keep it false by default so that "sidebar should not always there to be shown, when the user needed he can access the features of the sidebar by clicking on it".
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
