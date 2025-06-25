export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export type UserStatus = 'active' | 'inactive' | 'pending';
export type LanguageCode = 'sv' | 'en';
export interface User extends BaseEntity {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    preferredLanguage: LanguageCode;
    status: UserStatus;
    lastLogin?: string | null;
    avatarUrl?: string | null;
}
export interface Role extends BaseEntity {
    name: string;
    description?: string | null;
}
export type OrganizationStatus = 'active' | 'inactive' | 'trial';
export interface Organization extends BaseEntity {
    name: string;
    contactEmail: string;
    contactPhone?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    defaultLanguage: LanguageCode;
    status: OrganizationStatus;
}
export type TeamStatus = 'active' | 'inactive' | 'archived';
export interface Team extends BaseEntity {
    organizationId: string;
    name: string;
    category?: string | null;
    season?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    description?: string | null;
    status: TeamStatus;
}
export type TeamMemberRole = 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';
export interface TeamMember extends BaseEntity {
    teamId: string;
    userId: string;
    role: TeamMemberRole;
    position?: string | null;
    jerseyNumber?: string | null;
    startDate: string;
    endDate?: string | null;
}
export interface EventType extends BaseEntity {
    name: string;
    color: string;
    icon?: string | null;
    description?: string | null;
    defaultDuration?: number | null;
    organizationId?: string | null;
}
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}
export interface Location extends BaseEntity {
    name: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    coordinates?: GeoCoordinates | null;
    parentLocationId?: string | null;
    description?: string | null;
    organizationId: string;
}
export interface ResourceType extends BaseEntity {
    name: string;
    color: string;
    icon?: string | null;
    description?: string | null;
    organizationId: string;
}
export interface Resource extends BaseEntity {
    name: string;
    resourceTypeId: string;
    locationId: string;
    capacity?: number | null;
    description?: string | null;
    availableFrom?: string | null;
    availableTo?: string | null;
    organizationId: string;
}
export type EventStatus = 'scheduled' | 'canceled' | 'completed';
export interface Event extends BaseEntity {
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    eventTypeId: string;
    locationId?: string | null;
    teamId?: string | null;
    createdById: string;
    recurrenceRule?: string | null;
    parentEventId?: string | null;
    status: EventStatus;
    resourceIds?: string[];
}
export interface EventResourceLink {
    eventId: string;
    resourceId: string;
    bookingNote?: string | null;
    createdAt: string;
}
export type ParticipantStatus = 'invited' | 'confirmed' | 'declined' | 'tentative';
export interface EventParticipant {
    eventId: string;
    userId: string;
    status: ParticipantStatus;
    createdAt: string;
    updatedAt: string;
}
export interface ExampleType {
    id: string;
    name: string;
}
//# sourceMappingURL=index.d.ts.map