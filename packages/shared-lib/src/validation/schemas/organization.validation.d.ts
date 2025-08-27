export declare enum SubscriptionTier {
    FREE = "free",
    BASIC = "basic",
    PREMIUM = "premium",
    ENTERPRISE = "enterprise"
}
export declare class CreateOrganizationValidation {
    name: string;
    subdomain: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    subscriptionTier?: SubscriptionTier;
}
export declare class UpdateOrganizationValidation {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    isActive?: boolean;
}
export declare class UpdateSubscriptionValidation {
    tier: SubscriptionTier;
    expiresAt?: string;
}
export declare class OrganizationSettingsValidation {
    allowPlayerRegistration?: boolean;
    requireParentApproval?: boolean;
    enablePayments?: boolean;
    enableMedicalTracking?: boolean;
    enableTrainingPlans?: boolean;
    defaultLanguage?: string;
    defaultCurrency?: string;
    timezone?: string;
}
//# sourceMappingURL=organization.validation.d.ts.map