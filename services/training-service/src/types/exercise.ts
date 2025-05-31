export interface Exercise {
    id: string; // UUID
    name: string;
    description?: string;
    videoUrl?: string; // URL to instructional video
    muscleGroups?: string[]; // e.g., ['Chest', 'Triceps']
    equipmentRequired?: string[]; // e.g., ['Barbell', 'Bench']
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    category?: string; // User-defined category, e.g., 'Strength', 'Plyometrics', 'Mobility'
    createdByUserId?: string; // UUID - Who added this to the library
    organizationId?: string; // UUID - Optional, for organization-specific exercises
    isPublic?: boolean; // Accessible to all orgs? Default false
    createdAt: Date;
    updatedAt: Date;
}

// Optional: Define specific parameter types if exercises have structured parameters
// export interface ExerciseParameter {
//     name: 'Weight' | 'Reps' | 'Sets' | 'Duration' | 'Distance' | 'Rest';
//     unit?: 'kg' | 'lbs' | 'seconds' | 'meters' | 'km' | 'miles';
//     valueType: 'number' | 'range' | 'text';
// } 