// Define DTO interfaces for organization operations

export interface CreateOrganizationDto {
    name: string;
    contactEmail: string;
    contactPhone?: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    country?: string;
    primaryColor?: string;
    secondaryColor?: string;
    defaultLanguage?: 'sv' | 'en';
    // Status is usually set by the system (e.g., 'trial' initially)
}

export interface UpdateOrganizationDto {
    name?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    logoUrl?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    defaultLanguage?: 'sv' | 'en';
    status?: 'active' | 'inactive' | 'trial'; // Status changes likely admin-only
} 