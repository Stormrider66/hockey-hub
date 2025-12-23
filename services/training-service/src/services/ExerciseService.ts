// @ts-nocheck - Exercise template service
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib';
import { ExerciseTemplate, ExerciseCategory } from '../entities';
import { CreateExerciseTemplateDto, UpdateExerciseTemplateDto, ExerciseFilterDto } from '../dto/exercise.dto';
import { AppDataSource } from '../config/database';

export class ExerciseService {
  private readonly logger = new Logger('ExerciseService');
  private readonly exerciseRepository: Repository<ExerciseTemplate>;

  constructor() {
    this.exerciseRepository = AppDataSource.getRepository(ExerciseTemplate);
  }

  async create(dto: CreateExerciseTemplateDto, userId: string, organizationId?: string): Promise<ExerciseTemplate> {
    try {
      const exercise = this.exerciseRepository.create({
        ...dto,
        createdBy: userId,
        organizationId
      });

      const saved = await this.exerciseRepository.save(exercise);
      this.logger.info(`Created exercise template: ${saved.id}`, { exerciseId: saved.id, userId, organizationId });
      
      return saved;
    } catch (error) {
      this.logger.error('Failed to create exercise template', error as Error, { userId, dto });
      throw error;
    }
  }

  async findAll(filter: ExerciseFilterDto & { organizationId?: string }): Promise<{ data: ExerciseTemplate[]; total: number }> {
    try {
      const where: FindOptionsWhere<ExerciseTemplate> = {
        isActive: filter.isActive !== undefined ? filter.isActive : true
      };

      if (filter.organizationId) {
        where.organizationId = filter.organizationId;
      }

      if (filter.category) {
        where.category = filter.category;
      }

      if (filter.search) {
        where.name = ILike(`%${filter.search}%`);
      }

      const [data, total] = await this.exerciseRepository.findAndCount({
        where,
        skip: filter.skip || 0,
        take: filter.take || 50,
        order: {
          name: 'ASC'
        }
      });

      return { data, total };
    } catch (error) {
      this.logger.error('Failed to find exercises', error as Error, { filter });
      throw error;
    }
  }

  async findById(id: string): Promise<ExerciseTemplate> {
    try {
      const exercise = await this.exerciseRepository.findOne({
        where: { id }
      });

      if (!exercise) {
        const error = new Error(`Exercise not found: ${id}`);
        (error as any).statusCode = 404;
        throw error;
      }

      return exercise;
    } catch (error) {
      this.logger.error('Failed to find exercise by id', error as Error, { id });
      throw error;
    }
  }

  async update(id: string, dto: UpdateExerciseTemplateDto, userId: string): Promise<ExerciseTemplate> {
    try {
      const exercise = await this.findById(id);

      // Update fields
      Object.assign(exercise, dto);

      const updated = await this.exerciseRepository.save(exercise);
      this.logger.info(`Updated exercise template: ${id}`, { exerciseId: id, userId });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to update exercise', error as Error, { id, userId, dto });
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      const exercise = await this.findById(id);
      
      // Soft delete by setting isActive to false
      exercise.isActive = false;
      await this.exerciseRepository.save(exercise);
      
      this.logger.info(`Deleted (soft) exercise template: ${id}`, { exerciseId: id, userId });
    } catch (error) {
      this.logger.error('Failed to delete exercise', error as Error, { id, userId });
      throw error;
    }
  }

  async searchByName(query: string, organizationId?: string): Promise<ExerciseTemplate[]> {
    try {
      const where: FindOptionsWhere<ExerciseTemplate> = {
        name: ILike(`%${query}%`),
        isActive: true
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const exercises = await this.exerciseRepository.find({
        where,
        take: 10,
        order: {
          name: 'ASC'
        }
      });

      return exercises;
    } catch (error) {
      this.logger.error('Failed to search exercises', error as Error, { query });
      throw error;
    }
  }

  async findByCategory(category: ExerciseCategory, organizationId?: string): Promise<ExerciseTemplate[]> {
    try {
      const where: FindOptionsWhere<ExerciseTemplate> = {
        category,
        isActive: true
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const exercises = await this.exerciseRepository.find({
        where,
        order: {
          name: 'ASC'
        }
      });

      return exercises;
    } catch (error) {
      this.logger.error('Failed to find exercises by category', error as Error, { category });
      throw error;
    }
  }
}