import { BaseEntity } from '@hockey-hub/shared-lib';
import { Exercise } from './Exercise';
import { PlayerWorkoutLoad } from './PlayerWorkoutLoad';
import { WorkoutExecution } from './WorkoutExecution';
import { WorkoutType } from './WorkoutType';
export type WorkoutStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export declare class WorkoutSession extends BaseEntity {
    title: string;
    description: string;
    createdBy: string;
    type: WorkoutType;
    status: WorkoutStatus;
    scheduledDate: Date;
    location: string;
    teamId: string;
    playerIds: string[];
    estimatedDuration: number;
    settings: {
        allowIndividualLoads: boolean;
        displayMode: 'grid' | 'focus' | 'tv';
        showMetrics: boolean;
        autoRotation: boolean;
        rotationInterval: number;
    };
    exercises: Exercise[];
    playerLoads: PlayerWorkoutLoad[];
    executions: WorkoutExecution[];
}
//# sourceMappingURL=WorkoutSession.d.ts.map