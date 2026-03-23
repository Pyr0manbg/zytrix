'use client';

import React from 'react';
import { SectionCard } from '../UI';
import type { Client } from '../../types';

type AssistantMatchedClient = {
  id: string | number;
  name: string;
  phone: string;
};

type AssistantTabProps = {
  assistantInput: string;
  setAssistantInput: (value: string) => void;
  assistantLoading: boolean;
  assistantAnswer: string;
  assistantClients: AssistantMatchedClient[];
  assistantActions: string[];
  askAssistant: () => void;
  setSelectedClientId: (id: string) => void;
  setActiveTab: (tab: 'clients' | 'calendar') => void;
  setShowNewCallModal: (value: boolean) => void;
};

export default function AssistantTab({
  assistantInput,
  setAssistantInput,
  assistantLoading,
  assistantAnswer,
  assistantClients,
  assistantActions,
  askAssistant,
  setSelectedClientId,
  setActiveTab,
  setShowNewCallModal,
}: AssistantTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <SectionCard
        title="Zytrix Assistant"
        subtitle="Ask for call summaries, next steps, or coaching suggestions."
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4">
            <p className="mb-2 text-sm font-medium text-[#CBD5E1]">Your question</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={assistantInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    askAssistant();
                  }
                }}
                className="w-full rounded-2xl border border-[#334155] bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
              />
              <button
                onClick={askAssistant}
                disabled={assistantLoading}
                className="rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assistantLoading ? 'Thinking...' : 'Ask'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1E293B] bg-gradient-to-br from-[#0F172A] to-[#111827] p-5 text-slate-50 shadow-sm shadow-black/20">
            <p className="mb-3 text-sm font-medium text-[#93C5FD]">Zytrix Assistant</p>
            <p className="leading-7 text-[#E5E7EB]">{assistantAnswer}</p>

            {assistantClients.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[#93C5FD]">Related clients</p>

                {assistantClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-2xl border border-[#1E293B] bg-[#0F172A] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{client.name}</p>
                      <p className="text-xs text-[#94A3B8]">{client.phone}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClientId(String(client.id));
                        setActiveTab('clients');
                      }}
                      className="rounded-xl bg-[#1D4ED8] px-3 py-1 text-xs text-white"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}

            {assistantActions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {assistantActions.includes('call') && (
                  <button
                    onClick={() => setShowNewCallModal(true)}
                    className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] px-3 py-2 text-xs text-white"
                  >
                    Call
                  </button>
                )}

                {assistantActions.includes('schedule_followup') && (
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="rounded-xl border border-[#334155] px-3 py-2 text-xs text-[#CBD5E1]"
                  >
                    Schedule follow-up
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Quick actions" subtitle="Common workflows for brokers during the day.">
        <div className="space-y-3">
          {[
            'What did Ivan say yesterday?',
            'Which client needs follow-up today?',
            'How can I improve my last call?',
            'Show serious buyers this week.',
          ].map((item) => (
            <button
              key={item}
              onClick={() => setAssistantInput(item)}
              className="w-full rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4 text-left text-sm font-medium text-[#CBD5E1] transition hover:bg-[#172033]"
            >
              {item}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}