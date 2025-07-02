import { useState } from 'react';
import { useLazyExportEventsQuery } from '@/store/api/calendarApi';
import { toast } from 'react-hot-toast';

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
  const [exportEvents] = useLazyExportEventsQuery();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      const result = await exportEvents({
        format,
        ...options,
      }).unwrap();

      // Create a download link
      const url = window.URL.createObjectURL(result);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on format
      const filename = {
        ics: 'hockey-hub-calendar.ics',
        csv: 'hockey-hub-schedule.csv',
        html: 'hockey-hub-schedule.html',
      }[format];
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
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