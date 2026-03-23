'use client';

import React from 'react';
import { StatCard } from './UI';
import { createTranslator } from '@/lib/translations';

type StatsGridProps = {
  totalClients: number;
  callsToday: number;
  upcomingTasks: number;
  dealProbability: number;
};

export default function StatsGrid({
  totalClients,
  callsToday,
  upcomingTasks,
  dealProbability,
}: StatsGridProps) {
  const t = createTranslator('bg');
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t('todayTasks')}
        value={upcomingTasks}
        hint={t('pendingForToday')}
      />

     <StatCard
        label={t('activeClients')}
        value={totalClients}
        hint={t('livePipelineInProgress')}
      />

      <StatCard
        label={t('processedCalls')}
        value={callsToday}
        hint={t('callsReadyForReview')}
      />

     <StatCard
        label={t('followUps')}
        value={upcomingTasks}
        hint={t('clientsWaitingForNextAction')}
      />
    </div>
  );
}