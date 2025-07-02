export interface OrganizationDTO {
    id: string;
    name: string;
    subdomain: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
    subscriptionExpiresAt?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateOrganizationDTO {
    name: string;
    subdomain: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    subscriptionTier?: 'free' | 'basic' | 'premium' | 'enterprise';
}
export interface UpdateOrganizationDTO {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    isActive?: boolean;
}
export interface OrganizationWithStatsDTO extends OrganizationDTO {
    stats: {
        totalUsers: number;
        totalTeams: number;
        activeUsers: number;
        activeTeams: number;
    };
}
export interface OrganizationCreatedEvent {
    organizationId: string;
    name: string;
    subdomain: string;
    subscriptionTier: string;
    timestamp: string;
}
export interface OrganizationUpdatedEvent {
    organizationId: string;
    changes: Partial<OrganizationDTO>;
    timestamp: string;
}
export interface OrganizationDeactivatedEvent {
    organizationId: string;
    reason?: string;
    timestamp: string;
}
export interface SubscriptionChangedEvent {
    organizationId: string;
    oldTier: string;
    newTier: string;
    expiresAt?: string;
    timestamp: string;
}
//# sourceMappingURL=organization.dto.d.ts.map