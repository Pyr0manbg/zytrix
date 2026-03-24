'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createTranslator } from '@/lib/translations';
import { useRouter } from 'next/navigation';

import DesktopSidebar from './components/DesktopSidebar';
import HeroSection from './components/HeroSection';
import { getStoredLanguage } from './language';
import MobileBottomNav from './components/MobileBottomNav';
import {
  TodayTab,
  ClientsTab,
  AssistantTab,
  CalendarTab,
  CallsTab,
  AnalyticsTab,
} from './components/tabs';
import type { TabId } from './types';

import type { CalendarEvent, CallItem, Client, Task } from './types';
import {
  formatDateKey,
  getCalendarDays,
  parseDateKey,
  toDateKeyFromString,
} from './utils';

import AddClientModal from './components/AddClientModal';
import CallConfirmModal from './components/CallConfirmModal';
import NewCallModal from './components/NewCallModal';

const recentCalls: Array<{
  id: number | string;
  clientName?: string;
  duration?: string;
  status?: string;
  insight?: string;
}> = [];

function ZytrixLogo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#38BDF8] shadow-lg shadow-blue-500/20 ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-6 w-6 text-white">
        <path
          fill="currentColor"
          d="M16 14h32v6L27 44h21v6H16v-6l21-24H16z"
        />
      </svg>
      <div className="absolute inset-0 rounded-2xl border border-white/15" />
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [lang, setLang] = useState<'bg' | 'en'>(() => {
    if (typeof window === 'undefined') return 'bg';

    const savedLang = window.localStorage.getItem('zytrix-lang');
    return savedLang === 'en' ? 'en' : 'bg';
  });

  const t = createTranslator(lang);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');
  const [newClientInterest, setNewClientInterest] = useState('');
  const [newClientNextStep, setNewClientNextStep] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'Active' | 'Inactive'>('Active');
  const [query, setQuery] = useState('');
  const [assistantClients, setAssistantClients] = useState<any[]>([]);
  const [assistantActions, setAssistantActions] = useState<string[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [manualCallPhone, setManualCallPhone] = useState('');
  const [newCallSubmitting, setNewCallSubmitting] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState('');

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventType, setEventType] = useState<CalendarEvent['type']>('Viewing');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const selectedClient =
    clients.find((c) => c.id === selectedClientId) || clients[0] || null;

  const filteredClients = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.interest.toLowerCase().includes(q)
    );
  }, [clients, query]);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth]
  );

  const selectedDateKey = formatDateKey(selectedDate);

  const tasks = useMemo<Task[]>(() => {
    const now = new Date();

    return [...calendarEvents]
      .map((event, index) => {
        const eventDate = parseDateKey(event.dateKey);
        const [hours, minutes] = event.time.split(':').map(Number);

        eventDate.setHours(hours || 0, minutes || 0, 0, 0);

        return {
          id: typeof event.id === 'number' ? event.id : index,
          title: event.title,
          due: `${event.dateKey} ${event.time}`,
          done: eventDate < now,
        };
      })
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 5);
  }, [calendarEvents]);

  const completedTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = tasks.filter((t) => !t.done).length;

  const selectedDateEvents = useMemo(
    () =>
      calendarEvents
        .filter((event) => event.dateKey === selectedDateKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [calendarEvents, selectedDateKey]
  );

  const upcomingEvents = useMemo(() => {
    return [...calendarEvents]
      .sort((a, b) => {
        const aDate = `${a.dateKey} ${a.time}`;
        const bDate = `${b.dateKey} ${b.time}`;
        return aDate.localeCompare(bDate);
      })
      .slice(0, 5);
  }, [calendarEvents]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error || !data.session) {
        router.replace('/login');
        return;
      }

      setAuthChecked(true);
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    setLang(storedLanguage);
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientCalls(selectedClientId);
    }
  }, [selectedClientId]);

  useEffect(() => {
    const followUpEvents: CalendarEvent[] = clients
      .filter((c) => c.nextStep)
      .map((client) => {
        const dateKey = toDateKeyFromString(client.nextStep);
        if (!dateKey) return null;

        return {
          id: Number(`${client.id}99`),
          dateKey,
          title: `Follow-up: ${client.name}`,
          time: '10:00',
          type: 'Follow-up' as const,
        };
      })
      .filter(Boolean) as CalendarEvent[];

    setCalendarEvents((prev) => {
      const manualEvents = prev.filter((e) => e.type !== 'Follow-up');
      return [...manualEvents, ...followUpEvents];
    });
  }, [clients]);

  async function startManualVoipCall() {
    if (!manualCallPhone.trim()) return;

    try {
      setNewCallSubmitting(true);

      const response = await fetch('/api/voip/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: manualCallPhone.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to start call.');
        return;
      }

      await supabase.from('call_logs').insert({
        call_result: `Manual outbound call initiated to ${manualCallPhone.trim()}`,
        notes: 'Started from Zytrix dashboard',
        broker_id: 1,
      });

      alert('Call request sent successfully.');

      setManualCallPhone('');
      setShowNewCallModal(false);
    } catch (error) {
      console.error('NEW CALL ERROR:', error);
      alert('Unexpected error while starting the call.');
    } finally {
      setNewCallSubmitting(false);
    }
  }

  async function loadClients() {
    setClientsLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading clients:', error);
      setClientsLoading(false);
      return;
    }

    const mappedClients: Client[] = (data || []).map((item: any) => ({
      id: String(item.id),
      name: item.client_name || '',
      phone: item.phone_number || '',
      status: item.status === 'Inactive' ? 'Inactive' : 'Active',
      budget: item.budget || '',
      interest: item.notes || '',
      nextStep: item.follow_up || '',
      calls: [],
    }));

    setClients(mappedClients);

    if (mappedClients.length > 0) {
      setSelectedClientId(mappedClients[0].id);
    } else {
      setSelectedClientId('');
    }

    setClientsLoading(false);
  }

  async function loadClientCalls(clientId: string) {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('client_id', Number(clientId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading calls:', error);
      return;
    }

    const mappedCalls: CallItem[] = (data || []).map((call: any) => ({
      id: call.id,
      date: new Date(call.created_at).toLocaleDateString(),
      duration: '—',
      summary: call.call_result || '',
      coaching: call.notes || '',
    }));

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, calls: mappedCalls } : client
      )
    );
  }

  async function logCall(clientId: string) {
    const payload = {
      client_id: Number(clientId),
      call_result: 'Call initiated',
      notes: 'Manual call from Zytrix',
      broker_id: 1,
    };

    const { data, error } = await supabase.from('call_logs').insert(payload).select();

    console.log('CALL LOG DATA:', data);
    console.log('CALL LOG ERROR:', error);

    if (error) {
      alert(`Error logging call: ${error.message || 'Unknown error'}`);
      return;
    }

    alert('Call logged successfully');
  }

  async function addClient() {
    if (!newClientName.trim()) return;

    const payload = {
      client_name: newClientName.trim(),
      phone_number: newClientPhone.trim(),
      budget: newClientBudget.trim(),
      notes: newClientInterest.trim(),
      follow_up: newClientNextStep || null,
      status: newClientStatus,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('FULL ADD CLIENT ERROR:', JSON.stringify(error, null, 2));
      alert(`Error adding client: ${error.message || 'Unknown error'}`);
      return;
    }

    const createdClient: Client = {
      id: String(data.id),
      name: data.client_name || '',
      phone: data.phone_number || '',
      status: data.status === 'Inactive' ? 'Inactive' : 'Active',
      budget: data.budget || '',
      interest: data.notes || '',
      nextStep: data.follow_up || '',
      calls: [],
    };

    setClients((prev) => [createdClient, ...prev]);
    setSelectedClientId(createdClient.id);

    setNewClientName('');
    setNewClientPhone('');
    setNewClientBudget('');
    setNewClientInterest('');
    setNewClientNextStep('');
    setNewClientStatus('Active');
    setShowAddClientModal(false);
    setActiveTab('clients');
  }

  async function askAssistant() {
    if (!assistantInput.trim()) return;

    try {
      setAssistantLoading(true);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: assistantInput.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setAssistantAnswer(result.error || 'Failed to get assistant answer.');
        return;
      }

      setAssistantAnswer(result.answer || 'No answer returned.');
      setAssistantClients(result.matchedClients || []);
      setAssistantActions(result.suggestedActions || []);
    } catch (error) {
      console.error('ASK ASSISTANT ERROR:', error);
      setAssistantAnswer('Unexpected error while asking the assistant.');
    } finally {
      setAssistantLoading(false);
    }
  }

async function addCalendarEvent() {
  if (!eventTitle.trim()) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Not authenticated');
      return;
    }

    const payload = {
      user_id: session.user.id,
      title: eventTitle.trim(),
      event_date: selectedDateKey, // YYYY-MM-DD
      event_time: eventTime,
      event_type: eventType,
    };

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('ADD EVENT ERROR:', error);
      alert('Failed to add event');
      return;
    }

    // добавяме в local state (за моментален UI)
    const newEvent: CalendarEvent = {
      id: data.id,
      dateKey: data.event_date,
      title: data.title,
      time: data.event_time,
      type: data.event_type,
    };

    setCalendarEvents((prev) => [...prev, newEvent]);
    setEventTitle('');
  } catch (err) {
    console.error('ADD EVENT ERROR:', err);
  }
}

  function deleteEvent(id: number) {
    setCalendarEvents((prev) => prev.filter((event) => event.id !== id));
  }

  function previousMonth() {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    );
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08111F] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 backdrop-blur">
          Loading Zytrix...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#08111F] text-slate-100">
      <DesktopSidebar
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        lang={lang}
        bottomSlot={
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="hidden text-xs text-slate-400 group-hover:block">
              Zytrix v0.1
            </p>
          </div>
        }
      />

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-8">
          <HeroSection
            onNewCall={() => setShowNewCallModal(true)}
            onOpenCalendar={() => setActiveTab('calendar')}
            logo={<ZytrixLogo className="h-6 w-6" />}
          />

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setLang(lang === 'bg' ? 'en' : 'bg')}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
            >
              {lang === 'bg' ? 'EN' : 'BG'}
            </button>
          </div>

          {activeTab === 'today' && (
            <TodayTab
              activeClientsCount={clients.filter((c) => c.status === 'Active').length}
              processedCallsCount={recentCalls.filter((c) => c.status === 'Processed').length}
              pendingTasks={pendingTasks}
              tasks={tasks}
              recentCalls={recentCalls}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsTab />}

          {activeTab === 'calls' && <CallsTab />}

          {activeTab === 'clients' && (
            <ClientsTab
              clients={clients}
              filteredClients={filteredClients}
              clientsLoading={clientsLoading}
              selectedClient={selectedClient}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              setShowAddClientModal={setShowAddClientModal}
              setShowCallConfirmModal={setShowCallConfirmModal}
              query={query}
              setQuery={setQuery}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantTab
              assistantInput={assistantInput}
              setAssistantInput={setAssistantInput}
              assistantLoading={assistantLoading}
              assistantAnswer={assistantAnswer}
              assistantClients={assistantClients}
              assistantActions={assistantActions}
              askAssistant={askAssistant}
              setSelectedClientId={setSelectedClientId}
              setActiveTab={(tab) => setActiveTab(tab)}
              setShowNewCallModal={setShowNewCallModal}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarTab
              today={today}
              calendarMonth={calendarMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setCalendarMonth={setCalendarMonth}
              calendarDays={calendarDays}
              calendarEvents={calendarEvents}
              eventTitle={eventTitle}
              setEventTitle={setEventTitle}
              eventTime={eventTime}
              setEventTime={setEventTime}
              eventType={eventType}
              setEventType={setEventType}
              addCalendarEvent={addCalendarEvent}
              deleteEvent={deleteEvent}
              previousMonth={previousMonth}
              nextMonth={nextMonth}
              selectedDateKey={selectedDateKey}
              selectedDateEvents={selectedDateEvents}
              upcomingEvents={upcomingEvents}
            />
          )}
        </div>

        <AddClientModal
          open={showAddClientModal}
          newClientName={newClientName}
          newClientPhone={newClientPhone}
          newClientBudget={newClientBudget}
          newClientInterest={newClientInterest}
          newClientNextStep={newClientNextStep}
          newClientStatus={newClientStatus}
          setNewClientName={setNewClientName}
          setNewClientPhone={setNewClientPhone}
          setNewClientBudget={setNewClientBudget}
          setNewClientInterest={setNewClientInterest}
          setNewClientNextStep={setNewClientNextStep}
          setNewClientStatus={setNewClientStatus}
          onClose={() => setShowAddClientModal(false)}
          onSave={addClient}
        />

        <CallConfirmModal
          open={showCallConfirmModal}
          selectedClient={selectedClient}
          onClose={() => setShowCallConfirmModal(false)}
          onConfirm={async () => {
            if (!selectedClient) return;

            const response = await fetch('/api/voip', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber: selectedClient.phone,
              }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              alert(result.error || 'Failed to start call.');
              return;
            }

            await logCall(selectedClient.id);
            await loadClientCalls(selectedClient.id);
            setShowCallConfirmModal(false);
          }}
        />

        <NewCallModal
          open={showNewCallModal}
          phoneNumber={manualCallPhone}
          setPhoneNumber={setManualCallPhone}
          isSubmitting={newCallSubmitting}
          onClose={() => {
            if (newCallSubmitting) return;
            setShowNewCallModal(false);
          }}
          onConfirm={startManualVoipCall}
        />

        <MobileBottomNav
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </main>
  );
}