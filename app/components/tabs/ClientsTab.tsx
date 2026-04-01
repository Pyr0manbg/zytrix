'use client';

import React, { useEffect, useState } from 'react';
import { Badge, EmptyState, SectionCard } from '../UI';
import type { Client } from '../../types';
import { formatDisplayDate } from '../../utils';
import { supabase } from '../../../lib/supabase';

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

  const [leadStatus, setLeadStatus] = useState('active');
  const [showDealModal, setShowDealModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [buyerLeadDetails, setBuyerLeadDetails] = useState<any | null>(null);
  const [buyerLeadLoading, setBuyerLeadLoading] = useState(false);
  const [detailsLeadStatus, setDetailsLeadStatus] = useState('active');
  const [showDealOutcomeModal, setShowDealOutcomeModal] = useState(false);

  const handleOpenDetails = async (clientId: string) => {
  setBuyerLeadLoading(true);
  setShowDetailsModal(true);

  const { data, error } = await supabase
    .from('buyer_leads')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error loading buyer lead details:', error);
    setBuyerLeadDetails(null);
    setBuyerLeadLoading(false);
    return;
  }

  setBuyerLeadDetails(data || null);
  setDetailsLeadStatus(
  data?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'
);
  setBuyerLeadLoading(false);
};


    useEffect(() => {
      if (selectedClient) {
        setLeadStatus(
          selectedClient.status?.toLowerCase() === 'inactive'
            ? 'inactive'
            : 'active'
        );
      }
    }, [selectedClient]);

  const handleStatusSave = async () => {
    if (!selectedClient) return;

    if (leadStatus === 'inactive') {
      setShowDealModal(true);
      return;
    }

    const { error } = await supabase
      .from('buyer_leads')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', selectedClient.id);

    if (error) {
      console.error('Error saving lead status:', error);
      return;
    }

    console.log('Lead set to active');
  };

  const handleSaveDetailsStatus = async () => {
  if (!selectedClient) return;

  if (detailsLeadStatus === 'inactive') {
    setShowDealOutcomeModal(true);
    return;
  }

  const { error } = await supabase
    .from('buyer_leads')
    .update({
      status: 'active',
      deal_outcome: null,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', Number(selectedClient.id));

  if (error) {
    console.error('Error saving details lead status:', error);
    return;
  }

  setBuyerLeadDetails((prev: any) =>
    prev
      ? {
          ...prev,
          status: 'active',
          deal_outcome: null,
          updated_at: new Date().toISOString(),
        }
      : prev
  );
};

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
                    <p className="text-sm text-[#94A3B8]">{client.phone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(client.id);
                      }}
                      className="rounded-2xl border border-[#334155] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#172033]"
                    >
                      Details
                    </button>

                    <Badge
                      text={client.status}
                      active={client.status === 'Active'}
                    />
                  </div>
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
            <div className="mb-5 rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#94A3B8]">Lead status</p>
                <p className="mt-1 font-semibold text-white">
                  {leadStatus === 'active' ? 'Активен' : 'Неактивен'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  className="rounded-2xl border border-[#334155] bg-[#111827] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                </select>

                <button
                  onClick={handleStatusSave}
                  className="rounded-2xl border border-[#334155] px-4 py-2 text-sm font-medium text-white hover:bg-[#172033]"
                >
                  Запази
                </button>
              </div>
            </div>
          </div>
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

        {showDealModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-md rounded-3xl bg-[#0F172A] p-6 border border-[#1E293B]">
      <h2 className="text-lg font-semibold text-white mb-4">
        Имаше ли сделка?
      </h2>

      <div className="flex gap-3">
        <button
          onClick={async () => {
            await supabase
              .from('buyer_leads')
              .update({
                status: 'inactive',
                deal_outcome: 'won',
                updated_at: new Date().toISOString(),
              })
              .eq('client_id', selectedClient?.id);

              setBuyerLeadDetails((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        status: 'inactive',
                        deal_outcome: 'won',
                        updated_at: new Date().toISOString(),
                      }
                    : prev
                );

setLeadStatus('inactive');

            setShowDealModal(false);
          }}
          className="flex-1 rounded-2xl bg-green-600 px-4 py-2 text-white font-medium"
        >
          Да
        </button>

        <button
          onClick={async () => {
            await supabase
              .from('buyer_leads')
              .update({
                status: 'inactive',
                deal_outcome: 'lost',
                updated_at: new Date().toISOString(),
              })
              .eq('client_id', selectedClient?.id);


              setBuyerLeadDetails((prev: any) =>
                prev
                  ? {
                      ...prev,
                      status: 'inactive',
                      deal_outcome: 'lost',
                      updated_at: new Date().toISOString(),
                    }
                  : prev
              );

setLeadStatus('inactive');

            setShowDealModal(false);
          }}
          className="flex-1 rounded-2xl bg-red-600 px-4 py-2 text-white font-medium"
        >
          Не
        </button>
      </div>

      <button
        onClick={() => setShowDealModal(false)}
        className="mt-4 w-full text-sm text-[#94A3B8]"
      >
        Отказ
      </button>
    </div>
  </div>
)}

    {showDetailsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-2xl rounded-3xl border border-[#1E293B] bg-[#0F172A] p-6">
      
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Client Details</h2>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="rounded-xl border border-[#334155] px-3 py-1.5 text-sm text-white hover:bg-[#172033]"
        >
          Close
        </button>
      </div>

      {buyerLeadLoading ? (
        <p className="text-sm text-[#94A3B8]">Loading details...</p>
      ) : !buyerLeadDetails ? (
        <p className="text-sm text-[#94A3B8]">
          No buyer lead details found for this client.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          
          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4">
            <p className="text-sm text-[#94A3B8]">Status</p>
            <p className="mt-1 text-white">{buyerLeadDetails.status || '—'}</p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4">
            <p className="text-sm text-[#94A3B8]">Deal outcome</p>
            <p className="mt-1 text-white">{buyerLeadDetails.deal_outcome || '—'}</p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4">
            <p className="text-sm text-[#94A3B8]">Budget</p>
            <p className="mt-1 text-white">{buyerLeadDetails.budget || '—'}</p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4">
            <p className="text-sm text-[#94A3B8]">Property type</p>
            <p className="mt-1 text-white">{buyerLeadDetails.property_type || '—'}</p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4">
            <p className="text-sm text-[#94A3B8]">Motivation score</p>
            <p className="mt-1 text-white">{buyerLeadDetails.motivation_score ?? '—'}</p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4 md:col-span-2">
            <p className="text-sm text-[#94A3B8]">Target locations</p>
            <p className="mt-1 text-white break-words">
              {buyerLeadDetails.target_locations
                ? JSON.stringify(buyerLeadDetails.target_locations, null, 2)
                : '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4 md:col-span-2">
            <p className="text-sm text-[#94A3B8]">Requirements</p>
            <p className="mt-1 text-white break-words">
              {buyerLeadDetails.requirements
                ? JSON.stringify(buyerLeadDetails.requirements, null, 2)
                : '—'}
            </p>
          </div>

        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}