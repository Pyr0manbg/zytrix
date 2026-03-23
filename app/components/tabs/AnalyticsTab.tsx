'use client';

import React from 'react';
import { SectionCard } from '../UI';

export default function AnalyticsTab() {
  return (
    <SectionCard
      title="Analytics"
      subtitle="Performance insights, trends, and conversion visibility."
    >
      <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-6 text-sm text-[#94A3B8]">
        Analytics section placeholder. Next step can be extracting KPI cards and charts into this tab.
      </div>
    </SectionCard>
  );
}