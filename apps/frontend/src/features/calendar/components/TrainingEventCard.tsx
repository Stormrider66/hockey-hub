'use client';

import React from 'react';
import { Dumbbell, Users, Clock } from 'lucide-react';
import { CalendarEvent } from '@/store/api/calendarApi';
import { format } from 'date-fns';

interface TrainingEventCardProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
}

export default function TrainingEventCard({ event, style }: TrainingEventCardProps) {
  const trainingType = event.metadata?.trainingType;
  const participantCount = (event as any).participants?.filter((p: any) => {
    const status = (p.status || p.participationStatus || '').toString().toLowerCase();
    return status === 'accepted';
  }).length || 0;
  const totalParticipants = (event as any).participants?.length || 0;

  const getTrainingIcon = () => {
    switch (trainingType) {
      case 'physical':
        return <Dumbbell className="h-3 w-3" />;
      case 'ice':
        return '🏒';
      case 'video':
        return '📹';
      case 'recovery':
        return '🧘';
      default:
        return <Dumbbell className="h-3 w-3" />;
    }
  };

  return (
    <div style={style} className="p-1 text-xs">
      <div className="flex items-center gap-1">
        <span>{getTrainingIcon()}</span>
        <span className="font-semibold truncate">{event.title}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5 opacity-90">
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {format(new Date(event.startTime), 'HH:mm')}
        </span>
        <span className="flex items-center gap-0.5">
          <Users className="h-2.5 w-2.5" />
          {participantCount}/{totalParticipants}
        </span>
      </div>
    </div>
  );
}