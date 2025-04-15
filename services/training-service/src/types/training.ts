// import { Exercise } from './exercise'; // Comment out unused import

// Category for organizing templates
export interface PhysicalSessionCategory {
    id: string; // UUID
    name: string;
    createdByUserId: string; // UUID
    organizationId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

// Represents a single exercise instance within a session template or scheduled session
export interface SessionExercise {
    exerciseId: string; // UUID, links to the Exercise library
    order: number; // Sequence within the session/section
    sets?: number;
    reps?: string; // Can be a number or range like "8-12"
    duration?: number; // In seconds
    distance?: number; // In meters/km etc. (define unit?)
    restTime?: number; // Rest after this exercise/set, in seconds
    notes?: string;
    // Intensity definition
    intensityType?: 'percentage_1rm' | 'percentage_mhr' | 'rpe' | 'fixed_weight' | 'fixed_hr' | 'fixed_watts' | 'bodyweight';
    intensityValue?: number | string; // e.g., 75 (%) or 10 (RPE) or 100 (kg)
    intensityReferenceTestId?: string; // UUID of the TestDefinition used for % calculation
    // Fields for resolved intensity
    resolvedIntensityValue?: number | string; // The calculated value (e.g., 75kg, 150bpm)
    resolvedIntensityUnit?: string; // The unit for the resolved value (e.g., 'kg', 'bpm')
}

// Structure for a section within a template (e.g., Warmup, Main Lift, Cool Down)
export interface SessionSection {
    id: string; // Or maybe just an index/order within the template
    name: string;
    order: number;
    exercises: SessionExercise[];
    notes?: string;
    rounds?: number; // For circuit-style sections
    restBetweenRounds?: number; // In seconds
}

// Template for a physical training session
export interface PhysicalSessionTemplate {
    id: string; // UUID
    name: string;
    description?: string;
    categoryId: string; // UUID of PhysicalSessionCategory
    createdByUserId: string; // UUID
    organizationId: string; // UUID
    sections: SessionSection[]; // Structured content of the template
    estimatedDuration?: number; // In minutes, calculated or manually set
    isPublic?: boolean; // Template shared publicly?
    createdAt: Date;
    updatedAt: Date;
}

// Represents a scheduled instance of a training session for a user or team
export interface ScheduledPhysicalSession {
    id: string; // UUID
    templateId?: string; // UUID - Can be based on a template
    assignedToUserId?: string; // UUID
    assignedToTeamId?: string; // UUID
    scheduledDate: Date;
    calendarEventId?: string; // UUID - Link to the event in Calendar Service
    status: 'scheduled' | 'active' | 'completed' | 'canceled';
    // Sections and exercises might be copied and resolved with specific values here
    resolvedSections?: SessionSection[]; // Contains calculated intensity values for the specific user
    // Explicitly allow null for completionData
    completionData?: { 
        completedAt: Date;
        actualDuration?: number; // minutes
        feedback?: string; // User feedback
        rpe?: number; // Overall session RPE
        exerciseResults?: Array<{ // Store actual performance per exercise
            exerciseId: string;
            setsCompleted?: number;
            repsCompleted?: string;
            weightUsed?: number;
            durationAchieved?: number;
            notes?: string;
        }>;
    } | null; // Explicitly allow null
    createdAt: Date;
    updatedAt: Date;
} 