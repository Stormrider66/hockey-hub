export type EventType = 
    'ice-training' | 
    'physical-training' | 
    'game' | 
    'meeting' | 
    'medical' | 
    'travel' | 
    'other';

export interface CalendarEvent {
    id: string; // UUID
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    eventType: EventType;
    locationId?: string; // UUID
    teamId?: string; // UUID
    createdByUserId: string; // UUID
    resourceIds?: string[]; // UUIDs of linked resources
    participants?: EventParticipant[]; // Optional: loaded on demand
    status?: 'scheduled' | 'canceled' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

export interface EventParticipant {
    userId: string; // UUID
    firstName: string;
    lastName: string;
    role: string; // Role within the context of the event (e.g., player, coach)
    attendanceStatus?: 'attending' | 'absent' | 'maybe';
} 