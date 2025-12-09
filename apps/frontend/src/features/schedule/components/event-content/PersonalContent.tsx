import React from 'react';
import { User, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleEvent, UserRole } from '../../types';

interface PersonalContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const PersonalContent: React.FC<PersonalContentProps> = ({ event, role }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Activity
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Activity Type</p>
              <Badge variant="outline">
                {event.metadata?.activityType || 'Individual Training'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Focus Area</p>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {event.metadata?.focus || 'Skill Development'}
                </span>
              </div>
            </div>
            {event.metadata?.goals && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Goals</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{event.metadata.goals}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {event.metadata?.notes && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Notes</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{event.metadata.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};