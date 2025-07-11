import { WorkoutSession } from '../entities';
import { CachedRepository } from '@hockey-hub/shared-lib';
export declare class CachedWorkoutSessionRepository extends CachedRepository<WorkoutSession> {
    constructor();
    findSessionsByTeam(teamId: string, page?: number, limit?: number): Promise<[WorkoutSession[], number]>;
    findSessionsByPlayer(playerId: string, page?: number, limit?: number): Promise<[WorkoutSession[], number]>;
    findSessionsByDate(date: Date, teamId?: string): Promise<WorkoutSession[]>;
    findUpcomingSessions(playerId: string, teamId?: string, days?: number): Promise<WorkoutSession[]>;
    findSessionsByStatus(status: string, teamId?: string, limit?: number): Promise<WorkoutSession[]>;
    findWithCompleteDetails(id: string): Promise<WorkoutSession | null>;
    save(session: WorkoutSession): Promise<WorkoutSession>;
    remove(session: WorkoutSession): Promise<WorkoutSession>;
}
//# sourceMappingURL=CachedWorkoutSessionRepository.d.ts.map