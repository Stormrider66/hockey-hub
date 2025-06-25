export interface PlayerAvailabilityRow {
    id: string;
    player_id: string;
    current_status: string;
    notes: string | null;
    effective_from: Date;
    expected_end_date: Date | null;
    injury_id: string | null;
    updated_by_user_id: string;
    team_id: string;
    created_at: Date;
    updated_at: Date;
}
export declare const getCurrentAvailability: (playerId: string) => Promise<PlayerAvailabilityRow | null>;
export declare const createAvailabilityStatus: (status: {
    playerId: string;
    currentStatus: string;
    notes?: string;
    effectiveFrom: string;
    expectedEndDate?: string;
    injuryId?: string;
    updatedByUserId: string;
    teamId: string;
}) => Promise<PlayerAvailabilityRow>;
//# sourceMappingURL=playerAvailabilityRepository.d.ts.map