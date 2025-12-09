import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { CalendarEvent } from '@/store/api/calendarApi';
import { useGetEventsByDateRangeQuery } from '@/store/api/calendarApi';
import { skipToken } from '@reduxjs/toolkit/query';

export type ExportFormat = 'ics' | 'csv' | 'html';

interface UseCalendarExportOptions {
  organizationId: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const useCalendarExport = (options: UseCalendarExportOptions) => {
  const [isExporting, setIsExporting] = useState(false);

  // Preload events for the given range (will be cached); we’ll still gate on export click
  const { data: rangeEvents } = useGetEventsByDateRangeQuery(
    options.startDate && options.endDate
      ? {
          startDate: options.startDate,
          endDate: options.endDate,
          organizationId: options.organizationId,
          teamId: options.teamId,
          participantId: options.userId,
        }
      : (skipToken as any)
  ) as any;

  const fetchEvents = async (): Promise<CalendarEvent[]> => {
    try {
      if (rangeEvents) return rangeEvents as CalendarEvent[];
      // Fallback: call the API manually if needed
      const params = new URLSearchParams();
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);
      if (options.organizationId) params.set('organizationId', options.organizationId);
      if (options.teamId) params.set('teamId', options.teamId);
      if (options.userId) params.set('participantId', options.userId);

      const base = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/calendar';
      const res = await fetch(`${base}/events/date-range?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('access_token')
            ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CalendarEvent[];
      return json;
    } catch (e) {
      console.error('Failed to fetch events for export', e);
      return [];
    }
  };

  const toCsv = (events: CalendarEvent[]): Blob => {
    const header = ['Title', 'Type', 'Start', 'End', 'Location'];
    const rows = events.map((e) => [
      JSON.stringify(e.title || ''),
      JSON.stringify(e.type || ''),
      JSON.stringify(e.startTime || ''),
      JSON.stringify(e.endTime || ''),
      JSON.stringify((e as any).location || ''),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  };

  const toHtml = (events: CalendarEvent[]): Blob => {
    const rows = events
      .map(
        (e) =>
          `<tr><td>${e.title || ''}</td><td>${e.type || ''}</td><td>${e.startTime || ''}</td><td>${e.endTime || ''}</td><td>${(e as any).location || ''}</td></tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Hockey Hub Schedule</title></head><body><table border=\"1\"><thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Location</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    return new Blob([html], { type: 'text/html;charset=utf-8;' });
  };

  // Minimal ICS export (VEVENT lines per event)
  const toIcs = (events: CalendarEvent[]): Blob => {
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hockey Hub//Calendar Export//EN',
    ];
    for (const e of events) {
      const dtStart = new Date(e.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = new Date(e.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`SUMMARY:${(e.title || '').replace(/\n/g, ' ')}`);
      icsLines.push(`DTSTART:${dtStart}`);
      icsLines.push(`DTEND:${dtEnd}`);
      if ((e as any).location) icsLines.push(`LOCATION:${((e as any).location as string).replace(/\n/g, ' ')}`);
      icsLines.push('END:VEVENT');
    }
    icsLines.push('END:VCALENDAR');
    return new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const events = await fetchEvents();
      const blob = format === 'csv' ? toCsv(events) : format === 'html' ? toHtml(events) : toIcs(events);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = {
        ics: 'hockey-hub-calendar.ics',
        csv: 'hockey-hub-schedule.csv',
        html: 'hockey-hub-schedule.html',
      }[format];
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Calendar exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export calendar');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportCalendar: handleExport,
    isExporting,
  };
};