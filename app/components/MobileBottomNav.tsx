'use client';

import React from 'react';
import type { TabId } from '../types';

type MobileBottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

const mobileTabs: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'clients', label: 'Clients' },
  { id: 'assistant', label: 'AI' },
  { id: 'calendar', label: 'Calendar' },
];

export default function MobileBottomNav({
  activeTab,
  onChange,
}: MobileBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#1E293B] bg-[#111827]/95 px-3 py-3 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`rounded-2xl px-3 py-3 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] text-white'
                : 'bg-[#1E293B] text-[#CBD5E1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}