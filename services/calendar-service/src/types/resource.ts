export interface ResourceType {
    id: string; // UUID
    name: string;
    description?: string;
    organizationId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

export interface Resource {
    id: string; // UUID
    name: string;
    description?: string;
    resourceTypeId: string; // UUID
    locationId: string; // UUID
    capacity?: number;
    organizationId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

export interface ResourceAvailability {
    resourceId: string; // UUID
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    conflictingEventId?: string; // UUID of conflicting event if not available
} 