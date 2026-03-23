'use client';

import React from 'react';

type Props = {
  open: boolean;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function NewCallModal({
  open,
  phoneNumber,
  setPhoneNumber,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#1E293B] bg-[#111827] p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">New Call</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Enter a phone number to initiate a VOIP call.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#334155] px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#172033]"
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={phoneNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
            placeholder="+359888123456"
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />

          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
            <p className="text-sm text-[#CBD5E1]">
              Tip: use full international format when possible.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm font-semibold text-[#CBD5E1] hover:bg-[#172033]"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting || !phoneNumber.trim()}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Calling...' : 'Start Call'}
          </button>
        </div>
      </div>
    </div>
  );
}