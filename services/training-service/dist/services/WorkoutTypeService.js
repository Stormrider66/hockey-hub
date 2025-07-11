"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutTypeService = void 0;
const WorkoutType_1 = require("../entities/WorkoutType");
class WorkoutTypeService {
    constructor(workoutTypeConfigRepository) {
        this.workoutTypeConfigRepository = workoutTypeConfigRepository;
    }
    /**
     * Initialize default workout type configurations for an organization
     */
    async initializeDefaultConfigs(organizationId, createdBy) {
        const configs = [];
        for (const [type, defaultConfig] of Object.entries(WorkoutType_1.defaultWorkoutTypeConfigs)) {
            const existingConfig = await this.workoutTypeConfigRepository.findOne({
                where: {
                    organizationId,
                    workoutType: type,
                },
            });
            if (!existingConfig) {
                const config = this.workoutTypeConfigRepository.create({
                    ...defaultConfig,
                    organizationId,
                    workoutType: type,
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
    async create(organizationId, createDto, userId) {
        // Check if configuration already exists
        const existing = await this.workoutTypeConfigRepository.findOne({
            where: {
                organizationId,
                workoutType: createDto.workoutType,
            },
        });
        if (existing) {
            const error = new Error(`Configuration for workout type ${createDto.workoutType} already exists`);
            error.status = 409;
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
    async findAll(organizationId, pagination, filters) {
        const where = {
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
    async findOne(organizationId, workoutType) {
        const config = await this.workoutTypeConfigRepository.findOne({
            where: {
                organizationId,
                workoutType,
            },
        });
        if (!config) {
            // Try to return default configuration if custom doesn't exist
            const defaultConfig = WorkoutType_1.defaultWorkoutTypeConfigs[workoutType];
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
                });
            }
            const error = new Error(`Configuration for workout type ${workoutType} not found`);
            error.status = 404;
            throw error;
        }
        return this.toResponseDto(config);
    }
    /**
     * Update a workout type configuration
     */
    async update(organizationId, workoutType, updateDto, userId) {
        const config = await this.workoutTypeConfigRepository.findOne({
            where: {
                organizationId,
                workoutType,
            },
        });
        if (!config) {
            const error = new Error(`Configuration for workout type ${workoutType} not found`);
            error.status = 404;
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
    async delete(organizationId, workoutType) {
        const config = await this.workoutTypeConfigRepository.findOne({
            where: {
                organizationId,
                workoutType,
            },
        });
        if (!config) {
            const error = new Error(`Configuration for workout type ${workoutType} not found`);
            error.status = 404;
            throw error;
        }
        config.isActive = false;
        await this.workoutTypeConfigRepository.save(config);
    }
    /**
     * Increment usage count for a workout type
     */
    async incrementUsageCount(organizationId, workoutType) {
        await this.workoutTypeConfigRepository.increment({
            organizationId,
            workoutType,
        }, 'usageCount', 1);
    }
    /**
     * Get workout type statistics
     */
    async getStatistics(organizationId) {
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
    async validateMetrics(organizationId, workoutType, metrics) {
        const config = await this.findOne(organizationId, workoutType);
        const errors = [];
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
    async getProgressionRecommendations(organizationId, workoutType, currentLevel) {
        const config = await this.findOne(organizationId, workoutType);
        const levels = ['beginner', 'intermediate', 'advanced', 'elite'];
        const currentIndex = levels.indexOf(currentLevel);
        const nextIndex = currentIndex + 1;
        const recommendations = [];
        if (nextIndex < levels.length) {
            const nextLevel = levels[nextIndex];
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
    toResponseDto(config) {
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
exports.WorkoutTypeService = WorkoutTypeService;
//# sourceMappingURL=WorkoutTypeService.js.map