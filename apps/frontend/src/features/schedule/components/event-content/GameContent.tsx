import React from 'react';
import { Trophy, MapPin, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleEvent, UserRole } from '../../types';

interface GameContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const GameContent: React.FC<GameContentProps> = ({ event, role }) => {
  return (
    <div className="space-y-6">
      {/* Game Info */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Game Information
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Opponent</p>
              <p className="font-medium text-lg">{event.opponent || 'TBD'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <Badge variant="outline">{event.gameType || 'Regular Season'}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.homeAway === 'home' ? 'Home' : 'Away'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Venue</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-game Schedule */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Pre-game Schedule</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between p-2 border-l-4 border-blue-500">
              <span>Team Arrival</span>
              <span className="text-gray-600">5:00 PM</span>
            </div>
            <div className="flex justify-between p-2 border-l-4 border-blue-500">
              <span>Warm-up</span>
              <span className="text-gray-600">6:30 PM</span>
            </div>
            <div className="flex justify-between p-2 border-l-4 border-green-500">
              <span>Puck Drop</span>
              <span className="font-bold">7:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};