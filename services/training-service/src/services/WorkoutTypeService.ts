// @ts-nocheck - Workout type service
import { Repository, FindOptionsWhere } from 'typeorm';
import { WorkoutTypeConfig, WorkoutType, defaultWorkoutTypeConfigs } from '../entities/WorkoutType';
import { CreateWorkoutTypeConfigDto, UpdateWorkoutTypeConfigDto, WorkoutTypeConfigResponseDto } from '../dto/workout-type.dto';
import { PaginationDto } from '@hockey-hub/shared-lib';

export class WorkoutTypeService {
  constructor(
    private workoutTypeConfigRepository: Repository<WorkoutTypeConfig>,
  ) {}

  /**
   * Initialize default workout type configurations for an organization
   */
  async initializeDefaultConfigs(organizationId: string, createdBy: string): Promise<WorkoutTypeConfigResponseDto[]> {
    const configs: WorkoutTypeConfig[] = [];

    for (const [type, defaultConfig] of Object.entries(defaultWorkoutTypeConfigs)) {
      const existingConfig = await this.workoutTypeConfigRepository.findOne({
        where: {
          organizationId,
          workoutType: type as WorkoutType,
        },
      });

      if (!existingConfig) {
        const config = this.workoutTypeConfigRepository.create({
          ...defaultConfig,
          organizationId,
          workoutType: type as WorkoutType,
          createdBy,
          updatedBy: createdBy,
        });

        configs.push(await this.workoutTypeConfigRepository.save(config));
      }
    }

    return configs.map(config => this.toResponseDto(config));
  }

  /**
   * Create a custom workout type configuration
   */
  async create(
    organizationId: string,
    createDto: CreateWorkoutTypeConfigDto,
    userId: string
  ): Promise<WorkoutTypeConfigResponseDto> {
    // Check if configuration already exists
    const existing = await this.workoutTypeConfigRepository.findOne({
      where: {
        organizationId,
        workoutType: createDto.workoutType,
      },
    });

    if (existing) {
      const error = new Error(`Configuration for workout type ${createDto.workoutType} already exists`);
      (error as any).status = 409;
      throw error;
    }

    const config = this.workoutTypeConfigRepository.create({
      ...createDto,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.workoutTypeConfigRepository.save(config);
    return this.toResponseDto(saved);
  }

  /**
   * Get all workout type configurations for an organization
   */
  async findAll(
    organizationId: string,
    pagination?: PaginationDto,
    filters?: {
      workoutType?: WorkoutType;
      isActive?: boolean;
    }
  ): Promise<{
    items: WorkoutTypeConfigResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: FindOptionsWhere<WorkoutTypeConfig> = {
      organizationId,
    };

    if (filters?.workoutType) {
      where.workoutType = filters.workoutType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await this.workoutTypeConfigRepository.findAndCount({
      where,
      order: {
        workoutType: 'ASC',
      },
      skip,
      take: limit,
    });

    return {
      items: items.map(item => this.toResponseDto(item)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get a specific workout type configuration
   */
  async findOne(organizationId: string, workoutType: WorkoutType): Promise<WorkoutTypeConfigResponseDto> {
    const config = await this.workoutTypeConfigRepository.findOne({
      where: {
        organizationId,
        workoutType,
      },
    });

    if (!config) {
      // Try to return default configuration if custom doesn't exist
      const defaultConfig = defaultWorkoutTypeConfigs[workoutType];
      if (defaultConfig) {
        return this.toResponseDto({
          id: 'default',
          organizationId,
          workoutType,
          ...defaultConfig,
          isActive: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as WorkoutTypeConfig);
      }
      
      const error = new Error(`Configuration for workout type ${workoutType} not found`);
      (error as any).status = 404;
      throw error;
    }

    return this.toResponseDto(config);
  }

  /**
   * Update a workout type configuration
   */
  async update(
    organizationId: string,
    workoutType: WorkoutType,
    updateDto: UpdateWorkoutTypeConfigDto,
    userId: string
  ): Promise<WorkoutTypeConfigResponseDto> {
    const config = await this.workoutTypeConfigRepository.findOne({
      where: {
        organizationId,
        workoutType,
      },
    });

    if (!config) {
      const error = new Error(`Configuration for workout type ${workoutType} not found`);
      (error as any).status = 404;
      throw error;
    }

    Object.assign(config, {
      ...updateDto,
      updatedBy: userId,
    });

    const saved = await this.workoutTypeConfigRepository.save(config);
    return this.toResponseDto(saved);
  }

  /**
   * Delete a workout type configuration (soft delete by deactivating)
   */
  async delete(organizationId: string, workoutType: WorkoutType): Promise<void> {
    const config = await this.workoutTypeConfigRepository.findOne({
      where: {
        organizationId,
        workoutType,
      },
    });

    if (!config) {
      const error = new Error(`Configuration for workout type ${workoutType} not found`);
      (error as any).status = 404;
      throw error;
    }

    config.isActive = false;
    await this.workoutTypeConfigRepository.save(config);
  }

  /**
   * Increment usage count for a workout type
   */
  async incrementUsageCount(organizationId: string, workoutType: WorkoutType): Promise<void> {
    await this.workoutTypeConfigRepository.increment(
      {
        organizationId,
        workoutType,
      },
      'usageCount',
      1
    );
  }

  /**
   * Get workout type statistics
   */
  async getStatistics(organizationId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    mostUsed: Array<{ workoutType: WorkoutType; usageCount: number }>;
    recentlyUpdated: WorkoutTypeConfigResponseDto[];
  }> {
    const configs = await this.workoutTypeConfigRepository.find({
      where: { organizationId },
      order: { updatedAt: 'DESC' },
    });

    const activeConfigs = configs.filter(c => c.isActive);
    const mostUsed = configs
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(c => ({ workoutType: c.workoutType, usageCount: c.usageCount }));

    return {
      totalConfigs: configs.length,
      activeConfigs: activeConfigs.length,
      mostUsed,
      recentlyUpdated: configs.slice(0, 5).map(c => this.toResponseDto(c)),
    };
  }

  /**
   * Validate workout metrics against configuration
   */
  async validateMetrics(
    organizationId: string,
    workoutType: WorkoutType,
    metrics: Record<string, any>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const config = await this.findOne(organizationId, workoutType);
    const errors: string[] = [];

    // Check required primary metrics
    for (const metric of config.metricsConfig.primary) {
      if (!(metric in metrics)) {
        errors.push(`Missing required metric: ${metric}`);
      }
    }

    // Validate safety protocols
    if (config.safetyProtocols.maxIntensity && metrics.intensity) {
      if (metrics.intensity > config.safetyProtocols.maxIntensity) {
        errors.push(`Intensity ${metrics.intensity} exceeds maximum allowed ${config.safetyProtocols.maxIntensity}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get progression recommendations based on current level
   */
  async getProgressionRecommendations(
    organizationId: string,
    workoutType: WorkoutType,
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  ): Promise<{
    currentLevel: any;
    nextLevel: any;
    recommendations: string[];
  }> {
    const config = await this.findOne(organizationId, workoutType);
    const levels = ['beginner', 'intermediate', 'advanced', 'elite'];
    const currentIndex = levels.indexOf(currentLevel);
    const nextIndex = currentIndex + 1;

    const recommendations: string[] = [];

    if (nextIndex < levels.length) {
      const nextLevel = levels[nextIndex] as keyof typeof config.progressionModels;
      const currentProg = config.progressionModels[currentLevel];
      const nextProg = config.progressionModels[nextLevel];

      // Generate recommendations based on differences
      recommendations.push(`Progress from ${currentProg.duration} to ${nextProg.duration}`);
      
      for (const goal of nextProg.goals) {
        if (!currentProg.goals.includes(goal)) {
          recommendations.push(`Work towards: ${goal}`);
        }
      }

      return {
        currentLevel: currentProg,
        nextLevel: nextProg,
        recommendations,
      };
    }

    return {
      currentLevel: config.progressionModels[currentLevel],
      nextLevel: null,
      recommendations: ['You have reached the highest level. Focus on maintaining and optimizing performance.'],
    };
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(config: WorkoutTypeConfig): WorkoutTypeConfigResponseDto {
    return {
      id: config.id,
      workoutType: config.workoutType,
      organizationId: config.organizationId,
      name: config.name,
      description: config.description,
      metricsConfig: config.metricsConfig,
      equipmentRequirements: config.equipmentRequirements,
      progressionModels: config.progressionModels,
      safetyProtocols: config.safetyProtocols,
      customSettings: config.customSettings,
      isActive: config.isActive,
      usageCount: config.usageCount,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
    };
  }
}