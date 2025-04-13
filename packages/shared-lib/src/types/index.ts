// Placeholder for shared types/interfaces

export interface BaseEntity {
  id: string; // UUID
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  deletedAt?: string | null; // ISO Date string or null
}

// --- User Service Types ---

export type UserStatus = 'active' | 'inactive' | 'pending';
export type LanguageCode = 'sv' | 'en'; // Add more as needed

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  preferredLanguage: LanguageCode;
  status: UserStatus;
  lastLogin?: string | null; // ISO Date string
  avatarUrl?: string | null;
  // password_hash should likely NOT be shared
}

export interface Role extends BaseEntity {
  name: string; // e.g., 'admin', 'club_admin', 'coach', 'player', 'parent'
  description?: string | null;
}

// Interface for the junction table (often not needed as a direct type in services)
// export interface UserRoleLink {
//   userId: string;
//   roleId: string;
// }

export type OrganizationStatus = 'active' | 'inactive' | 'trial';

export interface Organization extends BaseEntity {
  name: string;
  contactEmail: string;
  contactPhone?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  primaryColor?: string | null; // Hex
  secondaryColor?: string | null; // Hex
  defaultLanguage: LanguageCode;
  status: OrganizationStatus;
}

export type TeamStatus = 'active' | 'inactive' | 'archived';

export interface Team extends BaseEntity {
  organizationId: string; // UUID
  name: string;
  category?: string | null;
  season?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null; // Hex
  description?: string | null;
  status: TeamStatus;
}

export type TeamMemberRole = 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';

export interface TeamMember extends BaseEntity {
  teamId: string; // UUID
  userId: string; // UUID
  role: TeamMemberRole;
  position?: string | null; // Player position
  jerseyNumber?: string | null;
  startDate: string; // ISO Date string (Date only)
  endDate?: string | null; // ISO Date string (Date only)
}

// --- Calendar Service Types ---

export interface EventType extends BaseEntity {
  name: string;
  color: string; // Hex
  icon?: string | null;
  description?: string | null;
  defaultDuration?: number | null; // minutes
  organizationId?: string | null; // UUID, null for system types
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
  coordinates?: GeoCoordinates | null; // Stored as JSONB
  parentLocationId?: string | null; // UUID
  description?: string | null;
  organizationId: string; // UUID
}

export interface ResourceType extends BaseEntity {
  name: string;
  color: string; // Hex
  icon?: string | null;
  description?: string | null;
  organizationId: string; // UUID
}

export interface Resource extends BaseEntity {
  name: string;
  resourceTypeId: string; // UUID
  locationId: string; // UUID
  capacity?: number | null;
  description?: string | null;
  availableFrom?: string | null; // Time string HH:MM
  availableTo?: string | null; // Time string HH:MM
  organizationId: string; // UUID
}

export type EventStatus = 'scheduled' | 'canceled' | 'completed';

export interface Event extends BaseEntity {
  title: string;
  description?: string | null;
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  eventTypeId: string; // UUID
  locationId?: string | null; // UUID
  teamId?: string | null; // UUID
  createdById: string; // UUID of user who created it
  recurrenceRule?: string | null; // iCal format RRULE
  parentEventId?: string | null; // UUID (for recurring instances)
  status: EventStatus;
  // Associated resources (often fetched separately or via junction table)
  resourceIds?: string[]; // UUID array
}

// Interface for the junction table (can be useful)
export interface EventResourceLink {
  eventId: string; // UUID
  resourceId: string; // UUID
  bookingNote?: string | null;
  createdAt: string; // ISO Date string
}

export type ParticipantStatus = 'invited' | 'confirmed' | 'declined' | 'tentative';

export interface EventParticipant {
  eventId: string; // UUID
  userId: string; // UUID
  status: ParticipantStatus;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// --- Add types for other services as needed ---

// Example placeholder (can be removed if not needed)
export interface ExampleType {
  id: string;
  name: string;
}

// Add common types related to Users, Teams, Events etc. here
// based on database-schema.md and API contracts 