export const translations = {
  en: {
    todayTasks: 'Today Tasks',
    activeClients: 'Active Clients',
    processedCalls: 'Processed Calls',
    followUps: 'Follow-ups',
    pendingForToday: 'Pending for today',
    livePipelineInProgress: 'Live pipeline in progress',
    callsReadyForReview: 'Calls ready for review',
    clientsWaitingForNextAction: 'Clients waiting for next action',
    overview: 'Overview',
    clients: 'Clients',
    calls: 'Calls',
    calendar: 'Calendar',
    assistant: 'Assistant',
    logout: 'Logout',
  },
  bg: {
    todayTasks: 'Задачи за днес',
    activeClients: 'Активни клиенти',
    processedCalls: 'Обработени разговори',
    followUps: 'Последващи действия',
    pendingForToday: 'Чакащи за днес',
    livePipelineInProgress: 'Активни клиенти в процес',
    callsReadyForReview: 'Разговори, готови за преглед',
    clientsWaitingForNextAction: 'Клиенти, чакащи следваща стъпка',
    overview: 'Начало',
    clients: 'Клиенти',
    calls: 'Обаждания',
    calendar: 'Календар',
    assistant: 'Асистент',
    logout: 'Изход',
  },
};

export type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function createTranslator(lang: Lang) {
  return function t(key: TranslationKey) {
    return translations[lang][key];
  };
}