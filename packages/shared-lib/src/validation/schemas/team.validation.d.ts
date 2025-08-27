export declare enum TeamType {
    YOUTH = "youth",
    JUNIOR = "junior",
    SENIOR = "senior",
    RECREATIONAL = "recreational"
}
export declare class CreateTeamValidation {
    organizationId: string;
    name: string;
    teamType: TeamType;
    ageGroup?: string;
    season?: string;
    logoUrl?: string;
}
export declare class UpdateTeamValidation {
    name?: string;
    teamType?: TeamType;
    ageGroup?: string;
    season?: string;
    logoUrl?: string;
    isActive?: boolean;
}
export declare class TeamRosterValidation {
    minPlayers?: number;
    maxPlayers?: number;
    minCoaches?: number;
    maxCoaches?: number;
}
export declare class TeamScheduleValidation {
    defaultPracticeTime?: string;
    practiceDays?: string[];
    practiceDurationMinutes?: number;
    defaultLocationId?: string;
}
//# sourceMappingURL=team.validation.d.ts.map