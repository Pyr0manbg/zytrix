'use client';

import React from 'react';
import BrandHeader from './BrandHeader';

type HeroSectionProps = {
  onNewCall: () => void;
  onOpenCalendar: () => void;
  logo: React.ReactNode;
};

export default function HeroSection({
  onNewCall,
  onOpenCalendar,
  logo,
}: HeroSectionProps) {
  return (
    <div className="mb-6 rounded-[28px] border border-[#1E293B] bg-gradient-to-br from-[#0E172A] to-[#111827] p-5 shadow-sm shadow-black/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <BrandHeader
          align="hero"
          title="Zytrix"
          badge="ZYTRIX INTELLIGENCE WORKSPACE"
          subtitle="AI operating system for real estate teams — calls, clients, follow-ups, coaching, and calendar in one focused workspace."
          logo={logo}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onNewCall}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            + New Call
          </button>

          <button
            onClick={onOpenCalendar}
            className="rounded-2xl border border-[#334155] px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-[#0F172A]"
          >
            Open Calendar
          </button>
        </div>

      </div>
    </div>
  );
}