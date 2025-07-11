"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseService = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const entities_1 = require("../entities");
const database_1 = require("../config/database");
class ExerciseService {
    constructor() {
        this.logger = new shared_lib_1.Logger('ExerciseService');
        this.exerciseRepository = database_1.AppDataSource.getRepository(entities_1.ExerciseTemplate);
    }
    async create(dto, userId, organizationId) {
        try {
            const exercise = this.exerciseRepository.create({
                ...dto,
                createdBy: userId,
                organizationId
            });
            const saved = await this.exerciseRepository.save(exercise);
            this.logger.info(`Created exercise template: ${saved.id}`, { exerciseId: saved.id, userId, organizationId });
            return saved;
        }
        catch (error) {
            this.logger.error('Failed to create exercise template', error, { userId, dto });
            throw error;
        }
    }
    async findAll(filter) {
        try {
            const where = {
                isActive: filter.isActive !== undefined ? filter.isActive : true
            };
            if (filter.organizationId) {
                where.organizationId = filter.organizationId;
            }
            if (filter.category) {
                where.category = filter.category;
            }
            if (filter.search) {
                where.name = (0, typeorm_1.ILike)(`%${filter.search}%`);
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
        }
        catch (error) {
            this.logger.error('Failed to find exercises', error, { filter });
            throw error;
        }
    }
    async findById(id) {
        try {
            const exercise = await this.exerciseRepository.findOne({
                where: { id }
            });
            if (!exercise) {
                const error = new Error(`Exercise not found: ${id}`);
                error.statusCode = 404;
                throw error;
            }
            return exercise;
        }
        catch (error) {
            this.logger.error('Failed to find exercise by id', error, { id });
            throw error;
        }
    }
    async update(id, dto, userId) {
        try {
            const exercise = await this.findById(id);
            // Update fields
            Object.assign(exercise, dto);
            const updated = await this.exerciseRepository.save(exercise);
            this.logger.info(`Updated exercise template: ${id}`, { exerciseId: id, userId });
            return updated;
        }
        catch (error) {
            this.logger.error('Failed to update exercise', error, { id, userId, dto });
            throw error;
        }
    }
    async delete(id, userId) {
        try {
            const exercise = await this.findById(id);
            // Soft delete by setting isActive to false
            exercise.isActive = false;
            await this.exerciseRepository.save(exercise);
            this.logger.info(`Deleted (soft) exercise template: ${id}`, { exerciseId: id, userId });
        }
        catch (error) {
            this.logger.error('Failed to delete exercise', error, { id, userId });
            throw error;
        }
    }
    async searchByName(query, organizationId) {
        try {
            const where = {
                name: (0, typeorm_1.ILike)(`%${query}%`),
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
        }
        catch (error) {
            this.logger.error('Failed to search exercises', error, { query });
            throw error;
        }
    }
    async findByCategory(category, organizationId) {
        try {
            const where = {
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
        }
        catch (error) {
            this.logger.error('Failed to find exercises by category', error, { category });
            throw error;
        }
    }
}
exports.ExerciseService = ExerciseService;
//# sourceMappingURL=ExerciseService.js.map