'use client';

import React from 'react';
import { EmptyState, SectionCard } from '../UI';
import type { CalendarEvent } from '../../types';
import {
  formatDateKey,
  monthNames,
  parseDateKey,
  sameDate,
} from '../../utils';

type CalendarTabProps = {
  today: Date;
  calendarMonth: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setCalendarMonth: (date: Date) => void;
  calendarDays: Date[];
  calendarEvents: CalendarEvent[];
  eventTitle: string;
  setEventTitle: (value: string) => void;
  eventTime: string;
  setEventTime: (value: string) => void;
  eventType: CalendarEvent['type'];
  setEventType: (value: CalendarEvent['type']) => void;
  addCalendarEvent: () => void;
  deleteEvent: (id: number) => void;
  previousMonth: () => void;
  nextMonth: () => void;
  selectedDateKey: string;
  selectedDateEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
};

export default function CalendarTab({
  today,
  calendarMonth,
  selectedDate,
  setSelectedDate,
  setCalendarMonth,
  calendarDays,
  calendarEvents,
  eventTitle,
  setEventTitle,
  eventTime,
  setEventTime,
  eventType,
  setEventType,
  addCalendarEvent,
  deleteEvent,
  previousMonth,
  nextMonth,
  selectedDateKey,
  selectedDateEvents,
  upcomingEvents,
}: CalendarTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <SectionCard
        title="Calendar"
        subtitle="Interactive calendar for viewings, calls, follow-ups, and meetings."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="rounded-xl border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#172033]"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="rounded-xl border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#CBD5E1] hover:bg-[#172033]"
            >
              →
            </button>
          </div>
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </h3>
          <button
            onClick={() => {
              setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDate(today);
            }}
            className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
          {[
            { full: 'Mon', short: 'M' },
            { full: 'Tue', short: 'T' },
            { full: 'Wed', short: 'W' },
            { full: 'Thu', short: 'T' },
            { full: 'Fri', short: 'F' },
            { full: 'Sat', short: 'S' },
            { full: 'Sun', short: 'S' },
          ].map(({ full, short }) => (
            <div
              key={full}
              className="rounded-lg bg-[#172554] px-1 py-1.5 text-center text-[10px] font-semibold text-[#BFDBFE] sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm"
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
            </div>
          ))}

          {calendarDays.map((date, index) => {
            const dateKey = formatDateKey(date);
            const dayEvents = calendarEvents.filter((event) => event.dateKey === dateKey);
            const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
            const isCurrentDay = sameDate(date, today);
            const isSelected = sameDate(date, selectedDate);

            return (
              <button
                key={`${dateKey}-${index}`}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[44px] rounded-xl border p-1 text-left transition sm:min-h-[110px] sm:rounded-3xl sm:p-3 ${
                  isSelected
                    ? 'border-[#38BDF8] bg-[#172554]'
                    : 'border-[#1E293B] bg-[#0F172A] hover:bg-[#172033]'
                } ${isCurrentDay ? 'ring-1 ring-blue-400/50 sm:ring-0' : ''}`}
              >
                <div className="flex items-start justify-between gap-0.5">
                  <span
                    className={`text-xs font-semibold sm:text-sm ${
                      isCurrentMonth ? 'text-[#E5E7EB]' : 'text-[#475569]'
                    } ${isCurrentDay ? 'text-blue-400' : ''}`}
                  >
                    {date.getDate()}
                  </span>
                  {isCurrentDay ? (
                    <span className="hidden rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] px-2 py-0.5 text-[10px] font-bold text-white sm:inline">
                      TODAY
                    </span>
                  ) : null}
                </div>

                {/* Event chips — desktop */}
                <div className="mt-1 hidden space-y-1 sm:block">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#38BDF8] px-2 py-1 text-[10px] font-medium text-white"
                    >
                      {event.time} · {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 ? (
                    <div className="text-[10px] text-[#93C5FD]">+{dayEvents.length - 2} more</div>
                  ) : null}
                </div>

                {/* Event dot — mobile */}
                {dayEvents.length > 0 ? (
                  <div className="mt-0.5 flex justify-center sm:hidden">
                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard
          title="Selected Day"
          subtitle={parseDateKey(selectedDateKey).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        >
          <div className="space-y-3">
            <input
              value={eventTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={eventTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventTime(e.target.value)}
                className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
              />

              <select
                value={eventType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setEventType(e.target.value as CalendarEvent['type'])
                }
                className="w-full rounded-2xl border border-[#334155] bg-[#0F172A] px-4 py-3 text-sm text-white outline-none focus:border-[#38BDF8] focus:ring-2 focus:ring-[#1D4ED8]/20"
              >
                <option>Viewing</option>
                <option>Follow-up</option>
                <option>Client call</option>
                <option>Meeting</option>
              </select>
            </div>

            <button
              onClick={addCalendarEvent}
              className="w-full rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Add Event
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {selectedDateEvents.length === 0 ? (
              <EmptyState title="No events for this day" subtitle="Create one from the form above." />
            ) : (
              selectedDateEvents.map((event) => (
                <div key={event.id} className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{event.title}</p>
                      <p className="mt-1 text-sm text-[#94A3B8]">
                        {event.time} · {event.type}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="rounded-xl border border-[#334155] px-3 py-1 text-xs text-[#CBD5E1] hover:bg-[#172033]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming" subtitle="Closest events across the calendar.">
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <EmptyState title="No upcoming events" subtitle="Add your first event in the calendar." />
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-3xl border border-[#1E293B] bg-[#0F172A] p-4 text-sm"
                >
                  <p className="font-semibold text-white">{event.title}</p>
                  <p className="mt-1 text-[#94A3B8]">
                    {parseDateKey(event.dateKey).toLocaleDateString('en-GB')} · {event.time}
                  </p>
                  <p className="mt-1 text-[#93C5FD]">{event.type}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}