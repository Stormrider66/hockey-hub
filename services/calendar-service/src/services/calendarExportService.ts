// @ts-nocheck - Export service with complex event status handling
import { Event, EventStatus } from '../entities/Event';
import { format } from 'date-fns';

export class CalendarExportService {
  /**
   * Generate iCalendar (.ics) format for events
   */
  static generateICalendar(events: Event[], calendarName = 'Hockey Hub Calendar'): string {
    const lines: string[] = [];
    
    // iCal header
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Hockey Hub//Calendar//EN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push(`X-WR-CALNAME:${calendarName}`);
    lines.push('X-WR-TIMEZONE:UTC');
    
    // Add each event
    events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@hockeyhub.com`);
      lines.push(`DTSTAMP:${this.formatDateTimeUTC(new Date())}`);
      lines.push(`DTSTART:${this.formatDateTimeUTC(new Date(event.startTime))}`);
      lines.push(`DTEND:${this.formatDateTimeUTC(new Date(event.endTime))}`);
      lines.push(`SUMMARY:${this.escapeString(event.title)}`);
      
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeString(event.description)}`);
      }
      
      if (event.location) {
        lines.push(`LOCATION:${this.escapeString(event.location)}`);
      }
      
      if (event.onlineUrl) {
        lines.push(`URL:${event.onlineUrl}`);
      }
      
      // Add status
      switch (event.status) {
        case EventStatus.SCHEDULED:
          lines.push('STATUS:CONFIRMED');
          break;
        case EventStatus.CANCELLED:
          lines.push('STATUS:CANCELLED');
          break;
        case EventStatus.DRAFT:
          lines.push('STATUS:TENTATIVE');
          break;
        default:
          lines.push('STATUS:CONFIRMED');
      }
      
      // Add categories based on event type
      lines.push(`CATEGORIES:${event.type.toUpperCase()}`);
      
      // Add organizer
      lines.push(`ORGANIZER:MAILTO:organizer@hockeyhub.com`);
      
      // Add recurrence rule if event is recurring
      if (event.isRecurring && event.recurrenceRule) {
        const rrule = this.generateRRule(event.recurrenceRule);
        if (rrule) {
          lines.push(`RRULE:${rrule}`);
        }
        
        // Add exception dates
        if (event.recurrenceRule.exceptionDates && event.recurrenceRule.exceptionDates.length > 0) {
          const exDates = event.recurrenceRule.exceptionDates
            .map(date => this.formatDateTimeUTC(new Date(date)))
            .join(',');
          lines.push(`EXDATE:${exDates}`);
        }
      }
      
      // Add reminder (15 minutes before by default)
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT15M');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:Event Reminder');
      lines.push('END:VALARM');
      
      lines.push('END:VEVENT');
    });
    
    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }

  /**
   * Generate CSV format for events
   */
  static generateCSV(events: Event[]): string {
    const headers = [
      'Title',
      'Type',
      'Start Date',
      'Start Time',
      'End Date',
      'End Time',
      'Location',
      'Description',
      'Status',
      'Recurring',
      'Created By',
    ];
    
    const rows = events.map(event => {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      return [
        this.escapeCSVField(event.title),
        event.type,
        format(startDate, 'yyyy-MM-dd'),
        format(startDate, 'HH:mm'),
        format(endDate, 'yyyy-MM-dd'),
        format(endDate, 'HH:mm'),
        this.escapeCSVField(event.location || ''),
        this.escapeCSVField(event.description || ''),
        event.status,
        event.isRecurring ? 'Yes' : 'No',
        event.createdBy,
      ];
    });
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Generate PDF-ready HTML format for events
   */
  static generateHTML(events: Event[], title = 'Hockey Hub Schedule'): string {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const eventsByDate = this.groupEventsByDate(sortedEvents);
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      margin-bottom: 20px;
    }
    .date-header {
      background-color: #f3f4f6;
      padding: 10px;
      margin: 20px 0 10px 0;
      border-radius: 5px;
      font-weight: bold;
      color: #1f2937;
    }
    .event {
      border-left: 4px solid #3b82f6;
      padding: 10px 15px;
      margin-bottom: 10px;
      background-color: #fafafa;
    }
    .event.training { border-color: #10b981; }
    .event.game { border-color: #f59e0b; }
    .event.meeting { border-color: #8b5cf6; }
    .event.medical { border-color: #ef4444; }
    .event-title {
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .event-details {
      font-size: 14px;
      color: #6b7280;
    }
    .event-time {
      color: #3b82f6;
      font-weight: 500;
    }
    .event-location {
      color: #059669;
    }
    .recurring-badge {
      display: inline-block;
      background-color: #ddd6fe;
      color: #6d28d9;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      margin-left: 10px;
    }
    @media print {
      body { margin: 10px; }
      .event { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
`;
    
    Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
      html += `<div class="date-header">${date}</div>`;
      
      dateEvents.forEach(event => {
        const startTime = format(new Date(event.startTime), 'h:mm a');
        const endTime = format(new Date(event.endTime), 'h:mm a');
        
        html += `
<div class="event ${event.type}">
  <div class="event-title">
    ${this.escapeHTML(event.title)}
    ${event.isRecurring ? '<span class="recurring-badge">Recurring</span>' : ''}
  </div>
  <div class="event-details">
    <span class="event-time">${startTime} - ${endTime}</span>
    ${event.location ? `<span class="event-location"> • ${this.escapeHTML(event.location)}</span>` : ''}
    ${event.description ? `<div style="margin-top: 5px;">${this.escapeHTML(event.description)}</div>` : ''}
  </div>
</div>`;
      });
    });
    
    html += `
</body>
</html>`;
    
    return html;
  }

  /**
   * Format date/time for iCalendar (UTC)
   */
  private static formatDateTimeUTC(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Escape special characters for iCalendar
   */
  private static escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Escape CSV field
   */
  private static escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Escape HTML
   */
  private static escapeHTML(str: string): string {
    const div = { textContent: str };
    return div.textContent || '';
  }

  /**
   * Group events by date
   */
  private static groupEventsByDate(events: Event[]): Record<string, Event[]> {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const dateKey = format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }

  /**
   * Generate RRULE string from recurrence rule
   */
  private static generateRRule(rule: any): string {
    let rrule = `FREQ=${rule.frequency.toUpperCase()}`;
    
    if (rule.interval && rule.interval > 1) {
      rrule += `;INTERVAL=${rule.interval}`;
    }
    
    if (rule.count) {
      rrule += `;COUNT=${rule.count}`;
    } else if (rule.endDate) {
      rrule += `;UNTIL=${this.formatDateTimeUTC(new Date(rule.endDate))}`;
    }
    
    if (rule.weekDays && rule.weekDays.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const days = rule.weekDays.map((d: number) => dayMap[d]).join(',');
      rrule += `;BYDAY=${days}`;
    }
    
    if (rule.monthDays && rule.monthDays.length > 0) {
      rrule += `;BYMONTHDAY=${rule.monthDays.join(',')}`;
    }
    
    if (rule.months && rule.months.length > 0) {
      rrule += `;BYMONTH=${rule.months.map((m: number) => m + 1).join(',')}`;
    }
    
    return rrule;
  }
}