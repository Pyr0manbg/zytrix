'use client';

import React from 'react';
import StatsGrid from '../StatsGrid';
import { Badge, SectionCard } from '../UI';

type Task = {
  id: number;
  title: string;
  due: string;
  done: boolean;
};

type CallItem = {
  id: number | string;
  clientName?: string;
  duration?: string;
  insight?: string;
  status?: string;
};

type TodayTabProps = {
  activeClientsCount: number;
  processedCallsCount: number;
  pendingTasks: number;
  tasks: Task[];
  recentCalls: CallItem[];
};

export default function TodayTab({
  activeClientsCount,
  processedCallsCount,
  pendingTasks,
  tasks,
  recentCalls,
}: TodayTabProps) {
  return (
    <>
      <StatsGrid
        totalClients={activeClientsCount}
        callsToday={processedCallsCount}
        upcomingTasks={pendingTasks}
        dealProbability={72}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard
          title="Today dashboard"
          subtitle="Your current priorities, active agreements, and follow-ups."
          right={<Badge text={`${pendingTasks} pending`} />}
        >
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-3xl border border-[#1E293B] bg-[#0F172A] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={task.done}
                    readOnly
                    className="h-4 w-4 rounded border-[#334155] bg-[#111827]"
                  />

                  <div>
                    <p
                      className={
                        task.done
                          ? 'text-sm text-slate-500 line-through'
                          : 'text-sm text-white'
                      }
                    >
                      {task.title}
                    </p>
                    <p className="text-sm text-[#94A3B8]">{task.due}</p>
                  </div>
                </div>

                <Badge text={task.done ? 'Done' : 'Pending'} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent calls"
          subtitle="Latest processed calls and quick AI insights."
        >
          <div className="space-y-3">
            {recentCalls.map((call) => (
              <div
                key={call.id}
                className="rounded-3xl border border-[#1E293B] bg-[#0F172A] px-4 py-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {call.clientName ?? 'Unknown lead'}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      Duration: {call.duration ?? '—'}
                    </p>
                  </div>

                  <Badge text={call.status ?? 'Unknown'} />
                </div>

                <p className="text-sm text-white">
                  {call.insight ?? 'No insight available'}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}