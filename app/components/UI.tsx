import React from 'react';

export function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#1E293B] bg-[#111827] p-5 shadow-sm shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#94A3B8]">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  const isNumeric = typeof value === 'number';

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[#1E293B] bg-[#111827] p-5 shadow-sm shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-[#334155] hover:shadow-lg hover:shadow-black/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#1D4ED8]/0 via-[#38BDF8]/70 to-[#1D4ED8]/0 opacity-80" />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-[#94A3B8]">{label}</p>
        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
      </div>

      <div className="min-h-[56px]">
        <p
          className={
            isNumeric
              ? 'text-3xl font-bold tracking-tight text-white'
              : 'text-2xl font-semibold leading-8 text-white'
          }
        >
          {value}
        </p>
      </div>

      {hint ? (
        <p className="mt-3 text-xs leading-5 text-[#64748B]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Badge({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? 'bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] text-white'
          : 'bg-[#1E293B] text-[#CBD5E1]'
      }`}
    >
      {text}
    </span>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#334155] bg-[#0F172A] p-8 text-center">
      <p className="text-sm font-medium text-[#CBD5E1]">{title}</p>
      <p className="mt-2 text-sm text-[#94A3B8]">{subtitle}</p>
    </div>
  );
}