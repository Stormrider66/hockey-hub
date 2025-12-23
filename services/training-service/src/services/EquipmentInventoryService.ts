// @ts-nocheck - Equipment inventory service
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib';
import { EquipmentItem, EquipmentStatus, WorkoutEquipmentType } from '../entities/EquipmentItem';
import { CreateEquipmentItemDto, UpdateEquipmentItemDto, EquipmentFilterDto } from '../dto/equipment.dto';
import { AppDataSource } from '../config/database';

export class EquipmentInventoryService {
  private readonly logger = new Logger('EquipmentInventoryService');
  private readonly equipmentRepository: Repository<EquipmentItem>;

  constructor() {
    this.equipmentRepository = AppDataSource.getRepository(EquipmentItem);
  }

  async create(dto: CreateEquipmentItemDto, userId: string): Promise<EquipmentItem> {
    try {
      const equipment = this.equipmentRepository.create({
        ...dto,
        lastMaintenanceDate: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : undefined,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : undefined,
      });

      const saved = await this.equipmentRepository.save(equipment);
      this.logger.info(`Created equipment item: ${saved.id}`, { 
        equipmentId: saved.id, 
        type: saved.type, 
        facilityId: saved.facilityId,
        userId 
      });
      
      return saved;
    } catch (error) {
      this.logger.error('Failed to create equipment item', error as Error, { userId, dto });
      throw error;
    }
  }

  async findAll(filter: EquipmentFilterDto): Promise<{ data: EquipmentItem[]; total: number }> {
    try {
      const where: FindOptionsWhere<EquipmentItem> = {
        isActive: filter.isActive !== undefined ? filter.isActive : true
      };

      if (filter.type) {
        where.type = filter.type;
      }

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.facilityId) {
        where.facilityId = filter.facilityId;
      }

      if (filter.location) {
        where.location = ILike(`%${filter.location}%`);
      }

      if (filter.search) {
        // Search in name, serialNumber, or notes
        const searchPattern = `%${filter.search}%`;
        where.name = ILike(searchPattern);
      }

      const [data, total] = await this.equipmentRepository.findAndCount({
        where,
        relations: ['reservations'],
        order: { name: 'ASC' },
        skip: (filter.page! - 1) * filter.limit!,
        take: filter.limit
      });

      this.logger.debug(`Found ${total} equipment items`, { filter, resultsCount: data.length });
      return { data, total };
    } catch (error) {
      this.logger.error('Failed to fetch equipment items', error as Error, { filter });
      throw error;
    }
  }

  async findById(id: string): Promise<EquipmentItem | null> {
    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id },
        relations: ['reservations']
      });

      if (!equipment) {
        this.logger.warn(`Equipment item not found: ${id}`);
        return null;
      }

      return equipment;
    } catch (error) {
      this.logger.error('Failed to fetch equipment item by ID', error as Error, { id });
      throw error;
    }
  }

  async findByFacilityAndType(facilityId: string, type: WorkoutEquipmentType): Promise<EquipmentItem[]> {
    try {
      const equipment = await this.equipmentRepository.find({
        where: { 
          facilityId, 
          type,
          isActive: true
        },
        relations: ['reservations'],
        order: { name: 'ASC' }
      });

      this.logger.debug(`Found ${equipment.length} equipment items`, { facilityId, type });
      return equipment;
    } catch (error) {
      this.logger.error('Failed to fetch equipment by facility and type', error as Error, { facilityId, type });
      throw error;
    }
  }

  async findAvailableByType(
    facilityId: string, 
    type: WorkoutEquipmentType, 
    startTime: Date, 
    endTime: Date
  ): Promise<EquipmentItem[]> {
    try {
      const allEquipment = await this.findByFacilityAndType(facilityId, type);
      
      const availableEquipment = allEquipment.filter(equipment => 
        equipment.status === EquipmentStatus.AVAILABLE &&
        equipment.isAvailableAt(startTime, endTime)
      );

      this.logger.debug(`Found ${availableEquipment.length} available equipment items`, { 
        facilityId, 
        type, 
        timeSlot: { startTime, endTime },
        totalItems: allEquipment.length
      });

      return availableEquipment;
    } catch (error) {
      this.logger.error('Failed to fetch available equipment', error as Error, { 
        facilityId, 
        type, 
        startTime, 
        endTime 
      });
      throw error;
    }
  }

  async update(id: string, dto: UpdateEquipmentItemDto, userId: string): Promise<EquipmentItem | null> {
    try {
      const equipment = await this.findById(id);
      if (!equipment) {
        this.logger.warn(`Equipment item not found for update: ${id}`);
        return null;
      }

      // Convert date strings to Date objects if provided
      const updateData = {
        ...dto,
        lastMaintenanceDate: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : equipment.lastMaintenanceDate,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : equipment.nextMaintenanceDate,
      };

      await this.equipmentRepository.update(id, updateData);
      
      const updated = await this.findById(id);
      this.logger.info(`Updated equipment item: ${id}`, { equipmentId: id, userId, changes: dto });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to update equipment item', error as Error, { id, userId, dto });
      throw error;
    }
  }

  async updateStatus(id: string, status: EquipmentStatus, userId: string, notes?: string): Promise<EquipmentItem | null> {
    try {
      const equipment = await this.findById(id);
      if (!equipment) {
        this.logger.warn(`Equipment item not found for status update: ${id}`);
        return null;
      }

      const updateData: Partial<EquipmentItem> = { status };
      if (notes) {
        updateData.notes = notes;
      }

      await this.equipmentRepository.update(id, updateData);
      
      const updated = await this.findById(id);
      this.logger.info(`Updated equipment status: ${id}`, { 
        equipmentId: id, 
        oldStatus: equipment.status,
        newStatus: status,
        userId,
        notes
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to update equipment status', error as Error, { id, status, userId });
      throw error;
    }
  }

  async bulkUpdateStatus(
    ids: string[], 
    status: EquipmentStatus, 
    userId: string, 
    notes?: string
  ): Promise<EquipmentItem[]> {
    try {
      const updateData: Partial<EquipmentItem> = { status };
      if (notes) {
        updateData.notes = notes;
      }

      await this.equipmentRepository.update({ id: In(ids) }, updateData);
      
      const updated = await this.equipmentRepository.find({
        where: { id: In(ids) },
        relations: ['reservations']
      });

      this.logger.info(`Bulk updated equipment status`, { 
        equipmentIds: ids,
        newStatus: status,
        userId,
        notes,
        updatedCount: updated.length
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to bulk update equipment status', error as Error, { ids, status, userId });
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const equipment = await this.findById(id);
      if (!equipment) {
        this.logger.warn(`Equipment item not found for deletion: ${id}`);
        return false;
      }

      // Soft delete - set isActive to false
      await this.equipmentRepository.update(id, { isActive: false });
      
      this.logger.info(`Deleted equipment item: ${id}`, { equipmentId: id, userId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete equipment item', error as Error, { id, userId });
      throw error;
    }
  }

  async getEquipmentSummary(facilityId: string): Promise<{
    total: number;
    byType: Record<WorkoutEquipmentType, number>;
    byStatus: Record<EquipmentStatus, number>;
    utilizationRate: number;
  }> {
    try {
      const equipment = await this.equipmentRepository.find({
        where: { facilityId, isActive: true }
      });

      const byType = {} as Record<WorkoutEquipmentType, number>;
      const byStatus = {} as Record<EquipmentStatus, number>;

      // Initialize counters
      Object.values(WorkoutEquipmentType).forEach(type => {
        byType[type] = 0;
      });
      Object.values(EquipmentStatus).forEach(status => {
        byStatus[status] = 0;
      });

      // Count equipment
      equipment.forEach(item => {
        byType[item.type]++;
        byStatus[item.status]++;
      });

      const total = equipment.length;
      const inUse = byStatus[EquipmentStatus.IN_USE] + byStatus[EquipmentStatus.RESERVED];
      const utilizationRate = total > 0 ? (inUse / total) * 100 : 0;

      const summary = {
        total,
        byType,
        byStatus,
        utilizationRate
      };

      this.logger.debug(`Generated equipment summary for facility: ${facilityId}`, summary);
      return summary;
    } catch (error) {
      this.logger.error('Failed to generate equipment summary', error as Error, { facilityId });
      throw error;
    }
  }

  async getMaintenanceSchedule(facilityId: string, days: number = 30): Promise<EquipmentItem[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const equipment = await this.equipmentRepository.find({
        where: {
          facilityId,
          isActive: true,
          nextMaintenanceDate: ILike(`%${futureDate.toISOString().split('T')[0]}%`)
        },
        order: { nextMaintenanceDate: 'ASC' }
      });

      this.logger.debug(`Found ${equipment.length} equipment items needing maintenance`, { 
        facilityId, 
        days 
      });
      
      return equipment;
    } catch (error) {
      this.logger.error('Failed to get maintenance schedule', error as Error, { facilityId, days });
      throw error;
    }
  }
}