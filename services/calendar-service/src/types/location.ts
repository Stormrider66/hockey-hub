export interface Location {
    id: string; // UUID
    name: string;
    address?: string;
    description?: string;
    organizationId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
} 