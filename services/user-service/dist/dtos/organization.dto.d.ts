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
    status?: 'active' | 'inactive' | 'trial';
}
//# sourceMappingURL=organization.dto.d.ts.map