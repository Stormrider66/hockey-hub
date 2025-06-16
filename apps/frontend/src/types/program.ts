export type ProgramType = 'strength' | 'conditioning' | 'core' | 'wrestling';

export interface ProgramExercise {
  exercise: string;
  sets: number;
  reps: number;
  description?: string;
}

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  warmup: ProgramExercise[];
  main: ProgramExercise[];
  core: ProgramExercise[];
  createdAt: string;
} 