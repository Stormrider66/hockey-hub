import React from 'react';
import { Clock, Target, Users, Snowflake } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleEvent, UserRole } from '../../types';

interface IcePracticeContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const IcePracticeContent: React.FC<IcePracticeContentProps> = ({ event, role }) => {
  const drills = event.drills || event.metadata?.drills || [
    { name: 'Warm-up Skating', duration: 10, type: 'warmup' },
    { name: 'Power Play Setup', duration: 20, type: 'tactical' },
    { name: '2-on-1 Drills', duration: 15, type: 'skill' },
    { name: 'Penalty Kill Practice', duration: 20, type: 'tactical' },
    { name: 'Scrimmage', duration: 25, type: 'game' },
  ];

  return (
    <div className="space-y-6">
      {/* Practice Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ice Time</p>
                <p className="text-2xl font-bold">90 min</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drills</p>
                <p className="text-2xl font-bold">{drills.length}</p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Focus</p>
                <p className="text-2xl font-bold">{event.focus || 'Tactical'}</p>
              </div>
              <Snowflake className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Plan */}
      <div>
        <h3 className="font-semibold mb-3">Practice Plan</h3>
        <div className="space-y-2">
          {drills.map((drill: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{drill.name}</p>
                <p className="text-sm text-gray-500">{drill.duration} minutes</p>
              </div>
              <Badge variant="outline">{drill.type}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Line Assignments */}
      {event.lines && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Line Assignments</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Line assignments will be displayed here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};