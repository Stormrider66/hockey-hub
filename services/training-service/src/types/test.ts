// services/training-service/src/types/test.ts

// Definition of a specific type of test
export interface TestDefinition {
    id: string; // UUID
    name: string;
    category: string; // e.g., 'Strength', 'Speed', 'Endurance', 'Agility', 'Flexibility'
    description?: string;
    protocol?: string; // Detailed instructions on how to perform the test
    unit: string; // e.g., 'kg', 'cm', 'seconds', 'reps', 'watts', 'm/s'
    scoreDirection: 'higher_is_better' | 'lower_is_better'; // For interpreting results
    organizationId?: string; // UUID - Optional, for organization-specific tests
    isPublic?: boolean; // Default false
    createdByUserId?: string; // UUID
    createdAt: Date;
    updatedAt: Date;
}

// A collection of tests scheduled to be performed together
export interface TestBatch {
    id: string; // UUID
    name: string;
    description?: string;
    organizationId: string; // UUID
    teamId?: string; // UUID - Optional, if specific to a team
    scheduledDate: Date;
    testDefinitionIds: string[]; // UUIDs of the tests included in this batch
    createdByUserId: string; // UUID
    status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
    createdAt: Date;
    updatedAt: Date;
}

// Result of a specific test for a specific player
export interface TestResult {
    id: string; // UUID
    playerId: string; // UUID
    testDefinitionId: string; // UUID
    testBatchId?: string; // UUID - Optional, if part of a batch
    value: number | string; // Store result value (could be number or specific text like 'DNF')
    unit: string; // Store unit with the result for clarity
    datePerformed: Date;
    administeredByUserId?: string; // UUID
    notes?: string;
    createdAt: Date;
    // Potentially add comparison fields later (e.g., percentile, difference from previous)
} 