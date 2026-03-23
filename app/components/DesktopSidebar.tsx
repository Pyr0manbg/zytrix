'use client';

import React from 'react';
import BrandHeader from './BrandHeader';
import type { TabId } from '../types';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { createTranslator } from '@/lib/translations';

const SidebarHomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.75L12 3.5l9 7.25" />
    <path d="M6 9.75V20h12V9.75" />
  </svg>
);

const SidebarAssistantIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    <path d="M8 10h8M8 14h5" />
  </svg>
);

const SidebarUsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 7 19.5V21" />
    <circle cx="12" cy="9" r="3.25" />
    <path d="M18.5 7.5a2.5 2.5 0 0 1 0 5" />
  </svg>
);

const SidebarPhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v2.2a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 11.2 18a19.5 19.5 0 0 1-5.95-5.95A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h2.3a2 2 0 0 1 2 1.72c.12.84.31 1.66.58 2.44a2 2 0 0 1-.45 2.11L7.2 9.57a16 16 0 0 0 7.23 7.23l1.3-1.29a2 2 0 0 1 2.11-.45c.78.27 1.6.46 2.44.58A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SidebarCalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 10h18" />
  </svg>
);

type DesktopSidebarProps = {
  activeKey: TabId;
  onChange: (key: TabId) => void;
  lang: 'bg' | 'en';
  bottomSlot?: React.ReactNode;
};

export default function DesktopSidebar({
  activeKey,
  onChange,
  bottomSlot,
  lang,
}: DesktopSidebarProps) {

  const router = useRouter();
  const t = createTranslator(lang);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const sidebarItems: Array<{
    key: TabId;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'today', label: t('overview'), icon: <SidebarHomeIcon /> },
    { key: 'clients', label: t('clients'), icon: <SidebarUsersIcon /> },
    { key: 'calls', label: t('calls'), icon: <SidebarPhoneIcon /> },
    { key: 'calendar', label: t('calendar'), icon: <SidebarCalendarIcon /> },
    { key: 'assistant', label: t('assistant'), icon: <SidebarAssistantIcon /> },
  ];

  return (
    <aside className="group hidden md:sticky md:top-0 md:flex md:h-screen">
      <div className="flex h-screen w-[96px] flex-col justify-between border-r border-white/10 bg-slate-950/95 px-3 py-4 backdrop-blur-xl transition-all duration-300 group-hover:w-[248px]">
        
        <div className="space-y-6">
          <BrandHeader />

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item.key === activeKey;

              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  className={`flex w-full items-center rounded-2xl px-2 py-2.5 text-left transition ${
                    isActive
                      ? 'bg-violet-600/15 text-white ring-1 ring-violet-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center">
                    {item.icon}
                  </span>

                  <span className="ml-1 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:opacity-100">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          {bottomSlot}

          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-2xl px-2 py-2.5 text-left text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center">
              🚪
            </span>

            <span className="ml-1 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:opacity-100">
              {t('logout')}
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
}