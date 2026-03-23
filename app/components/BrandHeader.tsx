'use client';

import React from 'react';

type BrandHeaderProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  logo?: React.ReactNode;
  align?: 'sidebar' | 'hero';
};

export default function BrandHeader({
  title = 'Zytrix',
  subtitle = 'Flow intelligence for brokers',
  badge,
  logo,
  align = 'sidebar',
}: BrandHeaderProps) {
  if (align === 'hero') {
    return (
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20">
          {logo ?? <span className="text-base font-bold tracking-wide">Z</span>}
        </div>

        <div className="min-w-0">
          {badge ? (
            <div className="mb-2 inline-flex rounded-full bg-[#172554] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#93C5FD]">
              {badge}
            </div>
          ) : null}

          <h1 className="truncate text-3xl font-semibold leading-tight text-white">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20">
        {logo ?? <span className="text-base font-bold tracking-wide">Z</span>}
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
        <p className="truncate text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}