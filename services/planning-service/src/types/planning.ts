export interface Season {
    id: string; // UUID
    organizationId: string; // UUID
    name: string; // e.g., "2024-2025"
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'active' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface SeasonPhase {
    id: string; // UUID
    seasonId: string; // UUID
    organizationId: string; // UUID
    name: string; // e.g., "Pre-Season", "Regular Season - Block 1"
    type?: 'pre_season' | 'regular_season' | 'playoffs' | 'off_season'; // Optional type categorization
    startDate: Date;
    endDate: Date;
    focusPrimary?: string; // e.g., "Aerobic Capacity", "Tactical Systems"
    focusSecondary?: string;
    description?: string;
    order?: number; // To order phases within a season
    createdAt: Date;
    updatedAt: Date;
}

// Optional: More detailed cycle structure within phases
export interface TrainingCycle {
    id: string; // UUID
    seasonPhaseId: string; // UUID
    parentCycleId?: string; // UUID, for micro cycles within meso, etc.
    type: 'macro' | 'meso' | 'micro';
    name: string;
    startDate: Date;
    endDate: Date;
    focus?: string;
    load?: 'high' | 'medium' | 'low' | 'recovery' | 'taper';
    description?: string;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}

export type GoalCategory = 'performance' | 'skill' | 'tactical' | 'physical' | 'behavioral' | 'other';
export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'partially_achieved' | 'not_achieved' | 'on_hold';

export interface Goal {
    id: string; // UUID
    organizationId: string; // UUID
    seasonId?: string; // UUID - Optional link to a season
    description: string; 
    category?: GoalCategory;
    measure?: string; // How the goal is measured (e.g., "Goals scored", "% completion")
    targetValue?: string | number; // The target to achieve
    priority?: 'high' | 'medium' | 'low';
    status: GoalStatus;
    dueDate?: Date;
    createdByUserId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

export interface TeamGoal extends Goal {
    teamId: string; // UUID
}

export interface PlayerGoal extends Goal {
    playerId: string; // UUID
}

export interface DevelopmentPlan {
    id: string; // UUID
    playerId: string; // UUID
    seasonId: string; // UUID
    organizationId: string; // UUID
    title: string; // e.g., "Development Plan 2024-2025"
    status: 'draft' | 'active' | 'completed' | 'archived';
    createdByUserId: string; // UUID (Coach/Admin)
    reviewSchedule?: string; // e.g., "Monthly", "End of Phase"
    overallComment?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DevelopmentPlanItem {
    id: string; // UUID
    developmentPlanId: string; // UUID
    skillArea: string; // e.g., "Skating Edge Work", "Defensive Zone Coverage", "Leadership"
    currentLevel?: string; // e.g., "Developing", "Needs Improvement", "Competent"
    targetLevel?: string; // e.g., "Proficient", "Consistent"
    actions?: string; // Specific drills, focus areas, feedback points
    resources?: string; // e.g., Link to video drill, coach responsible
    order?: number;
    createdAt: Date;
    updatedAt: Date;
} 