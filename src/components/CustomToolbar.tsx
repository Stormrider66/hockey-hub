import * as React from 'react';
import { ToolbarProps } from 'react-big-calendar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { enUS } from 'date-fns/locale/en-US';
import { sv } from 'date-fns/locale/sv';

// Define the views we want to support
const views = ['month', 'week', 'day'];

// Helper to get locale object
const getLocale = (localeString: string) => {
  if (localeString === 'sv') return sv;
  return enUS; // Default to enUS
};

export function CustomToolbar(toolbar: ToolbarProps) {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const view = (view: string) => {
    toolbar.onView(view as any); // Cast needed as ToolbarProps['view'] is stricter
  };

  // TODO: Get locale from preferencesSlice
  const currentLocaleString = 'en-US'; // Hardcoded for now, will be 'en' or 'sv' from Redux
  const localeObject = getLocale(currentLocaleString);

  // Format the label based on the current view
  let label = toolbar.label;
  try {
    if (toolbar.view === 'month') {
      label = format(toolbar.date, 'MMMM yyyy', { locale: localeObject });
    } else if (toolbar.view === 'week') {
      const start = toolbar.date;
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      // Format week range correctly respecting locale
      label = `${format(start, 'MMM d', { locale: localeObject })} - ${format(end, start.getMonth() === end.getMonth() ? 'd' : 'MMM d', { locale: localeObject })}, ${format(end, 'yyyy', { locale: localeObject })}`;
    } else if (toolbar.view === 'day') {
      label = format(toolbar.date, 'EEEE, MMMM d, yyyy', { locale: localeObject });
    }
  } catch (e) {
    console.error("Error formatting date label:", e);
    // Fallback to default label if formatting fails
  }

  return (
    <div className="rbc-toolbar flex items-center justify-between p-2 mb-4 bg-gray-100 rounded-t-lg">
      {/* Left side: Navigation */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={goToBack}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button variant="outline" onClick={goToCurrent}>Today</Button>
        <Button variant="outline" size="icon" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Center: Current Date Label */}
      <div className="text-lg font-semibold capitalize">
        {label}
      </div>

      {/* Right side: View Switcher */}
      <div className="flex items-center space-x-2">
        {views.map((viewName) => (
          <Button
            key={viewName}
            variant={toolbar.view === viewName ? 'default' : 'outline'}
            onClick={() => view(viewName)}
            className="capitalize"
          >
            {viewName}
          </Button>
        ))}
      </div>

      {/* TODO: Add Filters (Team, Location, Event Type) */}
    </div>
  );
} 