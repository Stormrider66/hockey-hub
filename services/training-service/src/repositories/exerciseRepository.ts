import { Repository, EntityRepository } from 'typeorm';
import { AppDataSource } from '../data-source'; // Assuming data-source.ts is now correct
import { Exercise } from '../entities/Exercise'; // Assuming Exercise.ts is now correct

@EntityRepository(Exercise)
export class ExerciseRepository extends Repository<Exercise> {
    // Find exercises with filters, pagination, and search
    async findExercises(filters: {
        organizationId?: string;
        category?: string;
        searchTerm?: string;
    }, limit: number, offset: number): Promise<Exercise[]> {
        const query = this.createQueryBuilder('exercise')
            .where('1=1'); // Start with true condition to chain WHERE clauses

        if (filters.organizationId) {
            query.andWhere('(exercise.organization_id = :orgId OR exercise.is_public = true)', {
                orgId: filters.organizationId
            });
        } else {
            query.andWhere('exercise.is_public = true');
        }

        if (filters.category) {
            query.andWhere('exercise.category = :category', { category: filters.category });
        }

        if (filters.searchTerm) {
            query.andWhere(
                '(exercise.name ILIKE :search OR exercise.description ILIKE :search)',
                { search: `%${filters.searchTerm}%` }
            );
        }

        return query
            .orderBy('exercise.created_at', 'DESC')
            .take(limit)
            .skip(offset)
            .getMany();
    }

    // Count exercises with filters
    async countExercises(filters: {
        organizationId?: string;
        category?: string;
        searchTerm?: string;
    }): Promise<number> {
        const query = this.createQueryBuilder('exercise')
            .where('1=1');

        if (filters.organizationId) {
            query.andWhere('(exercise.organization_id = :orgId OR exercise.is_public = true)', {
                orgId: filters.organizationId
            });
        } else {
            query.andWhere('exercise.is_public = true');
        }

        if (filters.category) {
            query.andWhere('exercise.category = :category', { category: filters.category });
        }

        if (filters.searchTerm) {
            query.andWhere(
                '(exercise.name ILIKE :search OR exercise.description ILIKE :search)',
                { search: `%${filters.searchTerm}%` }
            );
        }

        return query.getCount();
    }

    // Find a single exercise by ID
    async findExerciseById(id: string, organizationId?: string): Promise<Exercise | null> {
        const query = this.createQueryBuilder('exercise')
            .where('exercise.id = :id', { id });

        if (organizationId) {
            query.andWhere('(exercise.organization_id = :orgId OR exercise.is_public = true)', {
                orgId: organizationId
            });
        } else {
            query.andWhere('exercise.is_public = true');
        }

        return query.getOne();
    }

    // Create a new exercise
    async createExercise(data: Partial<Exercise>): Promise<Exercise> {
        const exercise = this.create(data);
        return this.save(exercise);
    }

    // Update an existing exercise
    async updateExercise(id: string, data: Partial<Exercise>): Promise<Exercise | null> {
        const result = await this.update(id, data);
        if (result.affected === 0) {
            return null;
        }
        return this.findOneBy({ id });
    }

    // Delete an exercise (soft delete if configured in entity)
    async deleteExercise(id: string): Promise<boolean> {
        const result = await this.softDelete(id);
        return result.affected === 1;
    }
}

// Export the repository instance
export const exerciseRepository = AppDataSource.getCustomRepository(ExerciseRepository);