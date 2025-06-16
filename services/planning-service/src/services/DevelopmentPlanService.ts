// @ts-nocheck

import { getRepository, Repository } from 'typeorm';
import { DevelopmentPlan } from '../entities/DevelopmentPlan'; // Assuming entity exists
import { NotFoundError, DatabaseError, InternalServerError } from '../errors/serviceErrors';
import logger from '../config/logger';
import { DevelopmentPlanItem } from '../entities/DevelopmentPlanItem';
import { CreateDevelopmentPlanInput, UpdateDevelopmentPlanInput, CreateDevelopmentPlanItemInput, UpdateDevelopmentPlanItemInput } from '../validation/developmentPlanSchemas';
import { AppDataSource } from '../data-source'; // Import AppDataSource

type UUID = string;

// Placeholder for List Options DTO
interface ListDevelopmentPlansOptions {
    page?: number;
    limit?: number;
    organizationId: UUID;
    teamId?: UUID;
    playerId?: UUID;
    status?: string; // Replace with GoalStatus enum if available here
    sort?: string;
    order?: 'asc' | 'desc';
}

export class DevelopmentPlanService {
    private planRepository: Repository<DevelopmentPlan>;
    private itemRepository: Repository<DevelopmentPlanItem>; // Add repository for items

    constructor() {
        // This assumes AppDataSource is initialized and available globally or passed in
        // A proper dependency injection setup is recommended later
        try {
            // Get repositories from AppDataSource
            this.planRepository = AppDataSource.getRepository(DevelopmentPlan);
            this.itemRepository = AppDataSource.getRepository(DevelopmentPlanItem);
        } catch (err) {
            logger.error("Error getting DevelopmentPlan repositories: ", err);
            throw new InternalServerError("Could not initialize DevelopmentPlanService");
        }
    }

    async listDevelopmentPlans(options: ListDevelopmentPlansOptions): Promise<{ plans: DevelopmentPlan[], total: number }> {
        const { 
            page = 1, 
            limit = 20, 
            organizationId,
            teamId,
            playerId,
            status,
            sort = 'createdAt', 
            order = 'desc'
        } = options;
        
        const skip = (page - 1) * limit;
        const queryBuilder = this.planRepository.createQueryBuilder('plan');

        queryBuilder.where('plan.organizationId = :organizationId', { organizationId });

        if (teamId) {
            queryBuilder.andWhere('plan.teamId = :teamId', { teamId });
        }
        if (playerId) {
            queryBuilder.andWhere('plan.playerId = :playerId', { playerId });
        }
        if (status) {
            queryBuilder.andWhere('plan.status = :status', { status });
        }

        // Basic sorting (adjust entity property names if needed)
        const allowedSort = ['createdAt','updatedAt','title','status'];
        const sortField = allowedSort.includes(sort) ? `plan.${sort}` : 'plan.createdAt'; 
        const safeLimit = Math.min(Math.max(limit,1),100);
        queryBuilder.orderBy(sortField, order.toUpperCase() as 'ASC' | 'DESC');

        queryBuilder.skip(skip).take(safeLimit);
        
        try {
            const [plans, total] = await queryBuilder.getManyAndCount();
            return { plans, total };
        } catch (error) {
            logger.error('Error listing development plans:', error);
            throw new DatabaseError('Failed to list development plans.', error);
        }
    }

    // Add stubs for other methods (create, getById, update, delete, manage items)
    async getDevelopmentPlanById(id: UUID, organizationId?: UUID): Promise<DevelopmentPlan> {
        const findOptions: any = { where: { id }, relations: ['items'] };
        if (organizationId) {
            findOptions.where.organizationId = organizationId;
        }
        
        try {
            const plan = await this.planRepository.findOne(findOptions);
            if (!plan) {
                throw new NotFoundError(`Development Plan with ID ${id} not found${organizationId ? ' within organization' : ''}`);
            }
            return plan;
        } catch (error) {
            logger.error(`Error fetching development plan ${id}:`, error);
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch development plan by ID.', error as Error);
        }
    }

    async createPlan(
        data: CreateDevelopmentPlanInput, 
        organizationId: UUID, 
        createdByUserId: UUID, 
        teamId?: UUID | null // Get teamId from user context if available
    ): Promise<DevelopmentPlan> {
        const newPlan = this.planRepository.create({
            ...data,
            organizationId,
            createdByUserId, // Store who created it
            teamId: teamId || null, // Store team context if available
            startDate: new Date(), // Set start date on creation
            status: (data as any).status ?? 'draft',
        });
        try {
            const savedPlan = await this.planRepository.save(newPlan);
            logger.info(`Development Plan created with ID: ${savedPlan.id}`);
            return savedPlan;
        } catch (error) {
            logger.error('Error creating development plan:', error);
            // TODO: Check for specific DB constraint errors (e.g., unique violations)
            throw new DatabaseError('Failed to create development plan.', error);
        }
    }

    async updatePlan(id: UUID, organizationId: UUID, data: UpdateDevelopmentPlanInput): Promise<DevelopmentPlan> {
        const plan = await this.getDevelopmentPlanById(id, organizationId); // Throws NotFoundError if not found/accessible

        // Merge existing data with updates
        this.planRepository.merge(plan, data);
        
        try {
            const updatedPlan = await this.planRepository.save(plan);
            logger.info(`Development Plan updated with ID: ${updatedPlan.id}`);
            return updatedPlan;
        } catch (error) {
            logger.error(`Error updating development plan ${id}:`, error);
            throw new DatabaseError('Failed to update development plan.', error);
        }
    }

    async deletePlan(id: UUID, organizationId: UUID): Promise<boolean> {
        await this.getDevelopmentPlanById(id, organizationId); // Ensures plan exists and belongs to org, throws NotFoundError if not

        try {
            const result = await this.planRepository.delete(id);
            const deleted = result.affected === 1;
            if (deleted) {
                 logger.info(`Development Plan deleted with ID: ${id}`);
            } else {
                 logger.warn(`Development Plan delete operation affected 0 rows for ID: ${id}`);
            }
            return deleted;
        } catch (error) {
            logger.error(`Error deleting development plan ${id}:`, error);
            throw new DatabaseError('Failed to delete development plan.', error);
        }
    }

    // --- Item Management Methods ---

    async addItem(planId: UUID, organizationId: UUID, data: CreateDevelopmentPlanItemInput): Promise<DevelopmentPlanItem> {
        await this.getDevelopmentPlanById(planId, organizationId); // Ensures parent plan exists/accessible

        const newItem = this.itemRepository.create({
            ...data,
            planId: planId, // Ensure association
            // Set default status if needed, or handle in entity/schema
        });

        try {
            const savedItem = await this.itemRepository.save(newItem);
            logger.info(`Development Plan Item created with ID: ${savedItem.id} for Plan ID: ${planId}`);
            return savedItem;
        } catch (error) {
             logger.error(`Error adding item to development plan ${planId}:`, error);
            throw new DatabaseError('Failed to add item to development plan.', error);
        }
    }

    async updateItem(planId: UUID, itemId: UUID, organizationId: UUID, data: UpdateDevelopmentPlanItemInput): Promise<DevelopmentPlanItem> {
        await this.getDevelopmentPlanById(planId, organizationId); // Ensures parent plan exists/accessible

        let item: DevelopmentPlanItem | null = null;
        try {
             item = await this.itemRepository.findOne({ where: { id: itemId, planId: planId } });
        } catch (error) {
            logger.error(`Error fetching development plan item ${itemId} for update:`, error);
            throw new DatabaseError('Failed to fetch development plan item for update.', error);
        }
       
        if (!item) {
            throw new NotFoundError(`Development Plan Item with ID ${itemId} not found for Plan ID ${planId}`);
        }

        // Merge updates
        this.itemRepository.merge(item, data);

        try {
            const updatedItem = await this.itemRepository.save(item);
            logger.info(`Development Plan Item updated with ID: ${updatedItem.id}`);
            return updatedItem;
        } catch (error) {
             logger.error(`Error updating development plan item ${itemId}:`, error);
            throw new DatabaseError('Failed to update development plan item.', error);
        }
    }

    async deleteItem(planId: UUID, itemId: UUID, organizationId: UUID): Promise<boolean> {
        await this.getDevelopmentPlanById(planId, organizationId); // Ensures parent plan exists/accessible

        try {
            const result = await this.itemRepository.delete({ id: itemId, planId: planId });
            const deleted = result.affected === 1;
             if (deleted) {
                 logger.info(`Development Plan Item deleted with ID: ${itemId} from Plan ID: ${planId}`);
            } else {
                 logger.warn(`Development Plan Item delete operation affected 0 rows for ID: ${itemId}, Plan ID: ${planId}`);
            }
            return deleted;
        } catch (error) {
            // Catch NotFoundError re-thrown above, or catch DB errors
            if (error instanceof NotFoundError) {
                throw error; // Re-throw NotFoundError
            }
            logger.error(`Error deleting development plan item ${itemId}:`, error);
            throw new DatabaseError('Failed to delete development plan item.', error);
        }
    }

    /**
     * Lists all items for a development plan within the specified organization.
     */
    async listItems(planId: UUID, organizationId: UUID): Promise<DevelopmentPlanItem[]> {
        // Verify parent plan access first
        await this.getDevelopmentPlanById(planId, organizationId);

        try {
            const items = await this.itemRepository.find({ where: { planId } });
            return items;
        } catch (error) {
            logger.error(`Error listing items for development plan ${planId}:`, error);
            throw new DatabaseError('Failed to list development plan items.', error as Error);
        }
    }

    // ... other method stubs ...
} 