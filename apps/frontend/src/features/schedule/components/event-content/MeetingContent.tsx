import React from 'react';
import { Users, Video, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScheduleEvent, UserRole } from '../../types';

interface MeetingContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const MeetingContent: React.FC<MeetingContentProps> = ({ event, role }) => {
  const agenda = event.metadata?.agenda || [
    'Team performance review',
    'Upcoming game strategy',
    'Player updates',
    'Q&A session'
  ];

  return (
    <div className="space-y-6">
      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meeting Information
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Format</p>
              <Badge variant="outline">
                {event.metadata?.meetingLink ? (
                  <><Video className="h-3 w-3 mr-1" /> Virtual</>
                ) : (
                  <><Users className="h-3 w-3 mr-1" /> In-Person</>
                )}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                60 minutes
              </p>
            </div>
            {event.metadata?.meetingLink && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Meeting Link</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(event.metadata.meetingLink, '_blank')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Virtual Meeting
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agenda
          </h3>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {agenda.map((item: string, idx: number) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                  {idx + 1}
                </span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Participants ({event.participants?.length || 0})</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            All team members and coaching staff are expected to attend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};