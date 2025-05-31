export interface Injury {
    id: string; // UUID
    playerId: string; // UUID - FK to users table
    teamId?: string; // UUID - FK to teams table (at time of injury)
    organizationId: string; // UUID - FK to organizations table
    dateOccurred: Date;
    dateReported: Date;
    bodyPart: string; // Consider using a predefined list/enum later
    injuryType: string; // Consider using a predefined list/enum later
    mechanism?: string; // How the injury happened
    severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
    description?: string; // Initial description
    diagnosis?: string;
    estimatedReturnDate?: Date; // ETR (Estimated Time to Return)
    status: 'active' | 'recovering' | 'recovered' | 'archived'; // Current status of this injury record
    reportedByUserId?: string; // UUID - User who reported it
    createdAt: Date;
    updatedAt: Date;
    // Potentially add link to current player availability status
    currentAvailabilityStatus?: PlayerAvailabilityStatus['status']; 
}

export interface InjuryUpdate {
    id: string; // UUID
    injuryId: string; // UUID - FK to injuries table
    date: Date;
    note: string;
    subjectiveAssessment?: string; // e.g., Pain level, feeling
    objectiveAssessment?: string; // e.g., ROM, strength test result
    createdByUserId: string; // UUID
    createdAt: Date;
}

export interface Treatment {
    id: string; // UUID
    injuryId: string; // UUID - FK to injuries table
    treatmentPlanId?: string; // UUID - Optional link to a plan
    date: Date;
    treatmentType: string; // e.g., 'Physiotherapy', 'Massage', 'Ice', 'Surgery Consult'
    notes?: string;
    durationMinutes?: number;
    performedByUserId: string; // UUID
    createdAt: Date;
}

export interface TreatmentPlanPhase {
    id: string; // Or just order/index
    name: string; // e.g., 'Phase 1: Acute', 'Phase 2: Subacute'
    order: number;
    description?: string;
    goals?: string[];
    estimatedDurationDays?: number;
    criteriaForProgression?: string[];
}

export interface TreatmentPlanItem {
    id: string; // Or just order/index
    description: string; // e.g., 'Ice 15 min', 'ROM exercises 2x10'
    frequency?: string; // e.g., 'Daily', '3 times/week'
    duration?: string; // e.g., '15 minutes', 'Until pain-free'
    notes?: string;
}

export interface TreatmentPlan {
    id: string; // UUID
    injuryId: string; // UUID - FK to injuries table
    title: string;
    description?: string;
    phases: TreatmentPlanPhase[]; // Array of phases
    items: TreatmentPlanItem[]; // Detailed items/exercises
    // Optional: Structure items under phases if needed
    status: 'draft' | 'active' | 'completed' | 'canceled';
    createdByUserId: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

// Represents the player's current availability for training/games
export interface PlayerAvailabilityStatus {
    id: string; // UUID - Could also just use player_id as PK if only storing current status
    playerId: string; // UUID - FK to users table
    status: 'full' | 'limited' | 'individual' | 'rehab' | 'unavailable';
    notes?: string; // e.g., 'No contact', 'Lower body only'
    restrictions?: string[];
    effectiveFrom: Date; // When this status became active
    updatedByUserId: string; // UUID
    updatedAt: Date;
    // Optional link back to the primary injury causing this status
    primaryInjuryId?: string; // UUID
}

// For more permanent, less frequently changing medical info
export interface PlayerMedicalInfo {
    id: string; // UUID - Or use playerId as PK
    playerId: string; // UUID - FK to users table
    allergies?: string;
    medicalConditions?: string; // e.g., Asthma
    surgicalHistory?: string;
    medications?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    lastPhysicalExamDate?: Date;
    notes?: string;
    updatedAt: Date;
} 