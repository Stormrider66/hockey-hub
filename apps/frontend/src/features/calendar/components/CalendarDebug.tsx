import React from 'react';
import { useGetEventsByDateRangeQuery } from '@/store/api/calendarApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CalendarDebugProps {
  organizationId: string;
  teamId?: string;
  startDate: string;
  endDate: string;
}

export default function CalendarDebug({ organizationId, teamId, startDate, endDate }: CalendarDebugProps) {
  const { data: events, isLoading, error } = useGetEventsByDateRangeQuery({
    organizationId,
    startDate,
    endDate,
    teamId,
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Calendar Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Organization ID:</strong> {organizationId}
          </div>
          <div>
            <strong>Team ID:</strong> {teamId || 'Not set'}
          </div>
          <div>
            <strong>Date Range:</strong> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Error:</strong> {error ? JSON.stringify(error) : 'None'}
          </div>
          <div>
            <strong>Events Count:</strong> {events ? events.length : 0}
          </div>
          {events && events.length > 0 && (
            <div>
              <strong>First Event:</strong>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(events[0], null, 2)}
              </pre>
            </div>
          )}
          <div>
            <strong>Mock API Enabled:</strong> {process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}