import React from 'react';
import { EventType, ScheduleEvent, UserRole } from '../../types';
import { TrainingContent } from './TrainingContent';
import { IcePracticeContent } from './IcePracticeContent';
import { GameContent } from './GameContent';
import { MedicalContent } from './MedicalContent';
import { MeetingContent } from './MeetingContent';
import { PersonalContent } from './PersonalContent';

interface EventContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const EventContent: React.FC<EventContentProps> = ({ event, role }) => {
  switch (event.type) {
    case EventType.TRAINING:
      return <TrainingContent event={event} role={role} />;
    
    case EventType.ICE_PRACTICE:
      return <IcePracticeContent event={event} role={role} />;
    
    case EventType.GAME:
      return <GameContent event={event} role={role} />;
    
    case EventType.MEDICAL:
      return <MedicalContent event={event} role={role} />;
    
    case EventType.MEETING:
      return <MeetingContent event={event} role={role} />;
    
    case EventType.PERSONAL:
      return <PersonalContent event={event} role={role} />;
    
    default:
      return (
        <div className="text-center py-8 text-gray-500">
          No specific content available for this event type.
        </div>
      );
  }
};