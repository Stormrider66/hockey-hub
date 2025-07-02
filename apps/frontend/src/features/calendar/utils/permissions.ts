import { CalendarEvent, EventVisibility, EventType } from '@/store/api/calendarApi';

export interface UserPermissions {
  userId: string;
  role: string;
  teamIds?: string[];
  organizationId: string;
}

export const canViewEvent = (event: CalendarEvent, user: UserPermissions): boolean => {
  // User can always see their own events
  if (event.createdBy === user.userId) {
    return true;
  }

  // User is a participant
  if (event.participants?.some(p => p.participantId === user.userId)) {
    return true;
  }

  // Check visibility rules
  switch (event.visibility) {
    case EventVisibility.PUBLIC:
      return true;
    
    case EventVisibility.TEAM:
      // User is in the same team
      if (event.teamId && user.teamIds?.includes(event.teamId)) {
        return true;
      }
      // Coaches and admins can see all team events
      if (['coach', 'admin', 'club-admin'].includes(user.role)) {
        return true;
      }
      break;
    
    case EventVisibility.PRIVATE:
      // Only participants and creator can see
      return false;
    
    case EventVisibility.ROLE_BASED:
      // Check if user's role is in allowed roles
      if (event.visibleToRoles?.includes(user.role)) {
        return true;
      }
      break;
  }

  // Special permissions for specific roles
  if (user.role === 'admin') {
    return true; // Admins can see everything
  }

  if (user.role === 'coach' && event.organizationId === user.organizationId) {
    return true; // Coaches can see all events in their organization
  }

  if (user.role === 'medical-staff' && event.type === EventType.MEDICAL) {
    return true; // Medical staff can see all medical events
  }

  if (user.role === 'equipment-manager' && event.type === EventType.EQUIPMENT) {
    return true; // Equipment managers can see all equipment events
  }

  return false;
};

export const canEditEvent = (event: CalendarEvent, user: UserPermissions): boolean => {
  // Creator can always edit
  if (event.createdBy === user.userId) {
    return true;
  }

  // Admins can edit everything
  if (user.role === 'admin') {
    return true;
  }

  // Coaches can edit team events
  if (user.role === 'coach' && event.teamId && user.teamIds?.includes(event.teamId)) {
    return true;
  }

  // Physical trainers can edit training events
  if (user.role === 'physical-trainer' && event.type === EventType.TRAINING) {
    return true;
  }

  // Medical staff can edit medical events
  if (user.role === 'medical-staff' && event.type === EventType.MEDICAL) {
    return true;
  }

  // Check if user is an organizer participant
  const participant = event.participants?.find(p => p.participantId === user.userId);
  if (participant?.isOrganizer || participant?.canEdit) {
    return true;
  }

  return false;
};

export const canDeleteEvent = (event: CalendarEvent, user: UserPermissions): boolean => {
  // Only creator and admins can delete
  return event.createdBy === user.userId || user.role === 'admin';
};

export const canInviteToEvent = (event: CalendarEvent, user: UserPermissions): boolean => {
  // Check if user can edit event
  if (!canEditEvent(event, user)) {
    return false;
  }

  // Check if user is allowed to invite others
  const participant = event.participants?.find(p => p.participantId === user.userId);
  if (participant && !participant.canInviteOthers) {
    return false;
  }

  return true;
};

export const getEventTypesByRole = (role: string): EventType[] => {
  switch (role) {
    case 'admin':
    case 'club-admin':
      return Object.values(EventType);
    
    case 'coach':
      return [
        EventType.TRAINING,
        EventType.GAME,
        EventType.MEETING,
        EventType.TEAM_EVENT,
        EventType.OTHER,
      ];
    
    case 'physical-trainer':
      return [EventType.TRAINING, EventType.MEETING, EventType.OTHER];
    
    case 'medical-staff':
      return [EventType.MEDICAL, EventType.MEETING, EventType.OTHER];
    
    case 'equipment-manager':
      return [EventType.EQUIPMENT, EventType.OTHER];
    
    case 'player':
      return [EventType.PERSONAL, EventType.OTHER];
    
    case 'parent':
      return [EventType.PERSONAL, EventType.OTHER];
    
    default:
      return [EventType.OTHER];
  }
};

export const getDefaultEventVisibility = (role: string, eventType: EventType): EventVisibility => {
  // Medical events should be private by default
  if (eventType === EventType.MEDICAL) {
    return EventVisibility.PRIVATE;
  }

  // Personal events are private
  if (eventType === EventType.PERSONAL) {
    return EventVisibility.PRIVATE;
  }

  // Training and games are team visible
  if ([EventType.TRAINING, EventType.GAME].includes(eventType)) {
    return EventVisibility.TEAM;
  }

  // Default based on role
  switch (role) {
    case 'player':
    case 'parent':
      return EventVisibility.PRIVATE;
    
    case 'coach':
    case 'physical-trainer':
      return EventVisibility.TEAM;
    
    default:
      return EventVisibility.TEAM;
  }
};