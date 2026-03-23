'use client';

import React from 'react';
import { SectionCard } from '../UI';

export default function CallsTab() {
  return (
    <SectionCard
      title="Calls"
      subtitle="Call history, outcomes, and review queue."
    >
      <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-6 text-sm text-[#94A3B8]">
        Calls section is ready for extraction next. We can move the recent calls list here after this step.
      </div>
    </SectionCard>
  );
}