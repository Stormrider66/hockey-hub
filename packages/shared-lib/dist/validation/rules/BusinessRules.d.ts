export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class BusinessRules {
    static validateUserAge(dateOfBirth: Date, role: string): ValidationResult;
    static validateTeamComposition(teamType: string, ageGroup: string, players: any[]): ValidationResult;
    static validateJerseyNumber(jerseyNumber: number, _teamId: string, existingNumbers: number[]): ValidationResult;
    static validateOrganizationLimits(_organizationId: string, subscriptionTier: string, currentCounts: {
        teams: number;
        users: number;
        storage: number;
    }): ValidationResult;
    static validateScheduleConflict(newEvent: {
        startTime: Date;
        endTime: Date;
        locationId: string;
        teamId?: string;
    }, existingEvents: Array<{
        startTime: Date;
        endTime: Date;
        locationId: string;
        teamId?: string;
    }>): ValidationResult;
    static validatePasswordChange(currentPassword: string, newPassword: string, confirmPassword: string, passwordHistory?: string[]): ValidationResult;
    static validateMedicalClearance(_playerId: string, injuries: Array<{
        status: string;
        severity: string;
        returnDate?: Date;
    }>): ValidationResult;
    private static calculateAge;
    private static getMinPlayersForTeamType;
    private static getMaxPlayersForTeamType;
    private static getSubscriptionLimits;
}
//# sourceMappingURL=BusinessRules.d.ts.map