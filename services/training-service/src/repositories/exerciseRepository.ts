// @ts-nocheck
import { AppDataSource } from '../data-source';
import { Exercise } from '../entities/Exercise';

const baseRepo = AppDataSource.getRepository(Exercise);

interface ExerciseFilters {
  organizationId?: string;
  category?: string;
  searchTerm?: string;
}

export const findExercises = async (filters: ExerciseFilters, limit = 20, offset = 0) => {
  const qb = baseRepo.createQueryBuilder('ex');
  if (filters.organizationId) {
    qb.andWhere('(ex.organizationId = :orgId OR ex.is_public = true)', { orgId: filters.organizationId });
  }
  if (filters.category) {
    qb.andWhere('ex.category = :cat', { cat: filters.category });
  }
  if (filters.searchTerm) {
    qb.andWhere('LOWER(ex.name) LIKE LOWER(:search)', { search: `%${filters.searchTerm}%` });
  }
  qb.skip(offset).take(limit).orderBy('ex.createdAt', 'DESC');
  return qb.getMany();
};

export const countExercises = async (filters: ExerciseFilters) => {
  const qb = baseRepo.createQueryBuilder('ex').select('COUNT(ex.id)', 'cnt');
  if (filters.organizationId) {
    qb.andWhere('(ex.organizationId = :orgId OR ex.is_public = true)', { orgId: filters.organizationId });
  }
  if (filters.category) {
    qb.andWhere('ex.category = :cat', { cat: filters.category });
  }
  if (filters.searchTerm) {
    qb.andWhere('LOWER(ex.name) LIKE LOWER(:search)', { search: `%${filters.searchTerm}%` });
  }
  const result = await qb.getRawOne<{ cnt: string }>();
  return parseInt(result?.cnt || '0', 10);
};

export const findExerciseById = async (id: string, organizationId?: string) => {
  if (organizationId) {
    // @ts-ignore
    return baseRepo.findOne({ where: [{ id: id as any, organizationId }, { id: id as any, is_public: true }] as any });
  }
  // @ts-ignore
  return baseRepo.findOne({ where: { id: id as any } as any });
};

export const createExercise = async (data: Partial<Exercise>): Promise<Exercise> => {
  const ex = baseRepo.create(data);
  return baseRepo.save(ex);
};

export const updateExercise = async (id: string, updates: Partial<Exercise>): Promise<Exercise | null> => {
  await baseRepo.update(id, updates);
  return baseRepo.findOne({ where: { id } });
};

export const deleteExercise = async (id: string): Promise<boolean> => {
  const res = await baseRepo.delete(id);
  return res.affected === 1;
};

export const exerciseRepository = {
  ...baseRepo,
  findExercises,
  countExercises,
  findExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};