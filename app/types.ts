export type Task = {
  id: number;
  title: string;
  due: string;
  done: boolean;
};

export type CallItem = {
  id: number;
  date: string;
  duration: string;
  summary: string;
  coaching: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  status: 'Active' | 'Inactive';
  budget: string;
  interest: string;
  nextStep: string; // follow-up date string (YYYY-MM-DD or ISO)
  calls: CallItem[];
};

export type CalendarEvent = {
  id: number;
  dateKey: string;
  title: string;
  time: string;
  type: 'Viewing' | 'Follow-up' | 'Client call' | 'Meeting';
};

export type TabId = (
  | 'today'
  | 'clients'
  | 'assistant'
  | 'calendar'
  | 'calls'
  | 'analytics'
);