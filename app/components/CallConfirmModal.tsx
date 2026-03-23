'use client';

import React from 'react';
import { Client } from '../types';

type Props = {
  open: boolean;
  selectedClient: Client | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function CallConfirmModal({
  open,
  selectedClient,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !selectedClient) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#1E293B] bg-[#111827] p-6 shadow-2xl shadow-black/40">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Confirm Call</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Do you want to log a call for{' '}
            <span className="font-semibold text-white">{selectedClient.name}</span>?
          </p>
        </div>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
          <p className="font-medium text-white">{selectedClient.name}</p>
          <p className="mt-1 text-sm text-[#94A3B8]">{selectedClient.phone}</p>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm font-semibold text-[#CBD5E1] hover:bg-[#172033]"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Confirm Call
          </button>
        </div>
      </div>
    </div>
  );
}