'use client';

import React from 'react';
import { Badge, EmptyState, SectionCard } from '../UI';
import type { Client } from '../../types';
import { formatDisplayDate } from '../../utils';

type ClientsTabProps = {
  clients: Client[];
  filteredClients: Client[];
  clientsLoading: boolean;
  selectedClient: Client | null;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  setShowAddClientModal: (v: boolean) => void;
  setShowCallConfirmModal: (v: boolean) => void;
  query: string;
  setQuery: (v: string) => void;
};

export default function ClientsTab({
  clients,
  filteredClients,
  clientsLoading,
  selectedClient,
  selectedClientId,
  setSelectedClientId,
  setShowAddClientModal,
  setShowCallConfirmModal,
  query,
  setQuery,
}: ClientsTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <SectionCard
        title="Clients"
        subtitle="Search and open a client profile instantly."
        right={
          <button
            onClick={() => setShowAddClientModal(true)}
            className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add Client
          </button>
        }
      >
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or interest"
            className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        {clientsLoading && (
          <p className="mb-3 text-sm text-[#94A3B8]">Loading clients...</p>
        )}

        <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
          {filteredClients.length === 0 ? (
            <EmptyState
              title="No clients found"
              subtitle="Try a different name, phone number, or property interest."
            />
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selectedClient?.id === client.id
                    ? 'border-[#38BDF8] bg-[#172554]'
                    : 'border-[#1E293B] bg-[#111827] hover:bg-[#172033]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    <p className="text-sm text-[#94A3B8]">
                      {client.phone}
                    </p>
                  </div>
                  <Badge
                    text={client.status}
                    active={client.status === 'Active'}
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </SectionCard>

      {selectedClient ? (
        <SectionCard
          title={selectedClient.name}
          subtitle={selectedClient.phone}
          right={
            <button
              onClick={() => setShowCallConfirmModal(true)}
              className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Call client
            </button>
          }
        >

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4 overflow-hidden">
              <p className="text-sm text-[#94A3B8]">Budget</p>
              <p className="mt-1 font-semibold text-white truncate">
                {selectedClient.budget || '—'}
              </p>
            </div>

            <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4 overflow-hidden">
              <p className="text-sm text-[#94A3B8]">Interest</p>
              <p className="mt-1 font-semibold text-white line-clamp-2">
                {selectedClient.interest || '—'}
              </p>
            </div>

            <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4 overflow-hidden">
              <p className="text-sm text-[#94A3B8]">Next step</p>
              <p className="mt-1 font-semibold text-white truncate">
                {formatDisplayDate(selectedClient.nextStep)}
              </p>
            </div>

          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">
                Call history
              </h3>
              <Badge text={`${selectedClient.calls.length} calls`} />
            </div>

            {selectedClient.calls.length === 0 ? (
              <EmptyState
                title="No calls yet"
                subtitle="This client was added manually and has no processed calls yet."
              />
            ) : (
              selectedClient.calls.map((call) => (
                <div
                  key={call.id}
                  className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4"
                >
                  <p className="text-sm text-[#94A3B8]">
                    {call.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Client profile"
          subtitle="Select a client to view details."
        >
          <EmptyState
            title="No client selected"
            subtitle="Choose a client from the list or add a new one."
          />
        </SectionCard>
      )}
    </div>
  );
}