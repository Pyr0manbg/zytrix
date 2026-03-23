'use client';

import React from 'react';

type Props = {
  open: boolean;
  newClientName: string;
  newClientPhone: string;
  newClientBudget: string;
  newClientInterest: string;
  newClientNextStep: string;
  newClientStatus: 'Active' | 'Inactive';
  setNewClientName: (value: string) => void;
  setNewClientPhone: (value: string) => void;
  setNewClientBudget: (value: string) => void;
  setNewClientInterest: (value: string) => void;
  setNewClientNextStep: (value: string) => void;
  setNewClientStatus: (value: 'Active' | 'Inactive') => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AddClientModal({
  open,
  newClientName,
  newClientPhone,
  newClientBudget,
  newClientInterest,
  newClientNextStep,
  newClientStatus,
  setNewClientName,
  setNewClientPhone,
  setNewClientBudget,
  setNewClientInterest,
  setNewClientNextStep,
  setNewClientStatus,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xl rounded-[28px] border border-[#1E293B] bg-[#111827] p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add Client</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">Create a new client profile manually.</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#334155] px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#172033]"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={newClientName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)}
            placeholder="Client name"
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />

          <input
            value={newClientPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientPhone(e.target.value)}
            placeholder="Phone"
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />

          <input
            value={newClientBudget}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientBudget(e.target.value)}
            placeholder="Budget"
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />

          <select
            value={newClientStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setNewClientStatus(e.target.value as 'Active' | 'Inactive')
            }
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <input
            value={newClientInterest}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientInterest(e.target.value)}
            placeholder="Interest"
            className="md:col-span-2 w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />

          <input
            type="date"
            value={newClientNextStep}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientNextStep(e.target.value)}
            className="md:col-span-2 w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm font-semibold text-[#CBD5E1] hover:bg-[#172033]"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Save Client
          </button>
        </div>
      </div>
    </div>
  );
}