'use client';

import React from 'react';
import type { TabId } from '../types';

type MobileBottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.75L12 3.5l9 7.25" />
    <path d="M6 9.75V20h12V9.75" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 7 19.5V21" />
    <circle cx="12" cy="9" r="3.25" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v2.2a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 11.2 18a19.5 19.5 0 0 1-5.95-5.95A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h2.3a2 2 0 0 1 2 1.72c.12.84.31 1.66.58 2.44a2 2 0 0 1-.45 2.11L7.2 9.57a16 16 0 0 0 7.23 7.23l1.3-1.29a2 2 0 0 1 2.11-.45c.78.27 1.6.46 2.44.58A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const AIIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    <path d="M8 10h8M8 14h5" strokeLinecap="round" />
  </svg>
);

const mobileTabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'today', label: 'Today', icon: <HomeIcon /> },
  { id: 'clients', label: 'Clients', icon: <UsersIcon /> },
  { id: 'calls', label: 'Calls', icon: <PhoneIcon /> },
  { id: 'calendar', label: 'Cal', icon: <CalendarIcon /> },
  { id: 'assistant', label: 'AI', icon: <AIIcon /> },
];

export default function MobileBottomNav({
  activeTab,
  onChange,
}: MobileBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1E293B] bg-[#111827]/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition ${
                isActive
                  ? 'bg-gradient-to-b from-[#1D4ED8] to-[#1e40af] text-white'
                  : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}