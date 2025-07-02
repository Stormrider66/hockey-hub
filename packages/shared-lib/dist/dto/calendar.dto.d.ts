export declare enum EventType {
    TRAINING = "training",
    GAME = "game",
    MEETING = "meeting",
    MEDICAL = "medical",
    EQUIPMENT = "equipment",
    TEAM_EVENT = "team_event",
    PERSONAL = "personal",
    OTHER = "other"
}
export declare enum EventStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    POSTPONED = "postponed"
}
export declare enum EventVisibility {
    PUBLIC = "public",
    TEAM = "team",
    PRIVATE = "private",
    ROLE_BASED = "role_based"
}
export declare enum ParticipantStatus {
    INVITED = "invited",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    MAYBE = "maybe",
    NOT_RESPONDED = "not_responded"
}
export declare enum RecurrenceFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export declare class CreateEventDto {
    title: string;
    description?: string;
    type: EventType;
    status?: EventStatus;
    visibility?: EventVisibility;
    startTime: string;
    endTime: string;
    allDay?: boolean;
    location?: string;
    onlineUrl?: string;
    color?: string;
    organizationId: string;
    teamId?: string;
    createdBy: string;
    metadata?: Record<string, any>;
    tags?: string[];
    notes?: string;
    allowRsvp?: boolean;
    maxParticipants?: number;
    sendReminders?: boolean;
    reminderMinutes?: number[];
    participants?: CreateParticipantDto[];
    resourceIds?: string[];
}
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    type?: EventType;
    status?: EventStatus;
    visibility?: EventVisibility;
    startTime?: string;
    endTime?: string;
    allDay?: boolean;
    location?: string;
    onlineUrl?: string;
    color?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    notes?: string;
    allowRsvp?: boolean;
    maxParticipants?: number;
    sendReminders?: boolean;
    reminderMinutes?: number[];
}
export declare class CreateParticipantDto {
    userId: string;
    status?: ParticipantStatus;
    isRequired?: boolean;
    role?: string;
    notes?: string;
}
export declare class UpdateParticipantStatusDto {
    status: ParticipantStatus;
    responseMessage?: string;
}
export declare class CreateRecurringEventDto extends CreateEventDto {
    recurrenceRule: RecurrenceRuleDto;
}
export declare class RecurrenceRuleDto {
    frequency: RecurrenceFrequency;
    interval: number;
    endDate?: string;
    count?: number;
    byWeekDay?: number[];
    byMonthDay?: number;
    exceptions?: string[];
}
export declare class CheckConflictsDto {
    startTime: string;
    endTime: string;
    participantIds: string[];
    excludeEventId?: string;
}
export declare class BulkAddParticipantsDto {
    participants: CreateParticipantDto[];
}
export declare enum ResourceType {
    FACILITY = "facility",
    EQUIPMENT = "equipment",
    STAFF = "staff",
    VEHICLE = "vehicle",
    ROOM = "room",
    ICE_RINK = "ice_rink",
    GYM = "gym",
    FIELD = "field",
    OTHER = "other"
}
export declare enum ResourceStatus {
    AVAILABLE = "available",
    UNAVAILABLE = "unavailable",
    MAINTENANCE = "maintenance",
    RESERVED = "reserved",
    RETIRED = "retired"
}
export declare class CreateResourceDto {
    name: string;
    description?: string;
    type: ResourceType;
    status?: ResourceStatus;
    organizationId: string;
    location?: string;
    building?: string;
    floor?: string;
    roomNumber?: string;
    capacity?: number;
    features?: Record<string, any>;
    availability?: Record<string, any>;
    maintenanceSchedule?: Record<string, any>;
    bookingRules?: Record<string, any>;
    metadata?: Record<string, any>;
    requiresApproval?: boolean;
    approverIds?: string[];
}
export declare class UpdateResourceDto {
    name?: string;
    description?: string;
    type?: ResourceType;
    status?: ResourceStatus;
    location?: string;
    building?: string;
    floor?: string;
    roomNumber?: string;
    capacity?: number;
    features?: Record<string, any>;
    availability?: Record<string, any>;
    maintenanceSchedule?: Record<string, any>;
    bookingRules?: Record<string, any>;
    metadata?: Record<string, any>;
    requiresApproval?: boolean;
    approverIds?: string[];
}
export declare class CheckResourceAvailabilityDto {
    resourceId: string;
    startTime: string;
    endTime: string;
    excludeBookingId?: string;
}
export declare class CreateResourceBookingDto {
    eventId: string;
    startTime: string;
    endTime: string;
    bookedBy: string;
    purpose?: string;
}
export declare class ApproveBookingDto {
    approvedBy: string;
}
export declare class CancelBookingDto {
    cancelledBy: string;
    reason?: string;
}
//# sourceMappingURL=calendar.dto.d.ts.map