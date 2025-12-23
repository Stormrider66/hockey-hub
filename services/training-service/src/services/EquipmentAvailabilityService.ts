// @ts-nocheck - Equipment availability service
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib';
import { EquipmentItem, WorkoutEquipmentType, EquipmentStatus } from '../entities/EquipmentItem';
import { FacilityEquipmentConfig } from '../entities/FacilityEquipmentConfig';
import { EquipmentReservation, ReservationStatus } from '../entities/EquipmentReservation';
import { 
  AvailabilityCheckDto, 
  BulkAvailabilityCheckDto, 
  EquipmentAvailabilityResponseDto,
  EquipmentRequirementDto
} from '../dto/equipment.dto';
import { AppDataSource } from '../config/database';
import { EquipmentInventoryService } from './EquipmentInventoryService';

export class EquipmentAvailabilityService {
  private readonly logger = new Logger('EquipmentAvailabilityService');
  private readonly equipmentRepository: Repository<EquipmentItem>;
  private readonly configRepository: Repository<FacilityEquipmentConfig>;
  private readonly reservationRepository: Repository<EquipmentReservation>;
  private readonly inventoryService: EquipmentInventoryService;

  constructor() {
    this.equipmentRepository = AppDataSource.getRepository(EquipmentItem);
    this.configRepository = AppDataSource.getRepository(FacilityEquipmentConfig);
    this.reservationRepository = AppDataSource.getRepository(EquipmentReservation);
    this.inventoryService = new EquipmentInventoryService();
  }

  async checkAvailability(dto: AvailabilityCheckDto): Promise<EquipmentAvailabilityResponseDto> {
    try {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);

      // Get facility configuration
      const config = await this.configRepository.findOne({
        where: {
          facilityId: dto.facilityId,
          equipmentType: dto.equipmentType,
          isActive: true
        }
      });

      if (!config) {
        throw new Error(`No configuration found for ${dto.equipmentType} at facility ${dto.facilityId}`);
      }

      // Check if facility can accommodate the session
      if (!config.canAccommodateSession(startTime, endTime, dto.requiredCount)) {
        this.logger.warn(`Facility cannot accommodate session`, {
          facilityId: dto.facilityId,
          equipmentType: dto.equipmentType,
          requiredCount: dto.requiredCount,
          timeSlot: { startTime, endTime }
        });
      }

      // Get all equipment of this type at the facility
      const allEquipment = await this.inventoryService.findByFacilityAndType(
        dto.facilityId, 
        dto.equipmentType
      );

      // Filter available equipment
      const availableEquipment = allEquipment.filter(equipment => 
        equipment.status === EquipmentStatus.AVAILABLE &&
        equipment.isAvailableAt(startTime, endTime)
      );

      // Get conflict information for unavailable equipment
      const conflicts = await this.getConflictsForTimeSlot(
        dto.facilityId,
        dto.equipmentType,
        startTime,
        endTime
      );

      const response: EquipmentAvailabilityResponseDto = {
        equipmentType: dto.equipmentType,
        facilityId: dto.facilityId,
        totalCount: config.totalCount,
        availableCount: availableEquipment.length,
        availableItems: availableEquipment.map(equipment => ({
          id: equipment.id,
          name: equipment.name,
          location: equipment.location,
          status: equipment.status
        })),
        conflicts
      };

      this.logger.debug(`Availability check completed`, {
        dto,
        availableCount: availableEquipment.length,
        totalCount: config.totalCount,
        conflictCount: conflicts?.length || 0
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to check equipment availability', error as Error, { dto });
      throw error;
    }
  }

  async checkBulkAvailability(dto: BulkAvailabilityCheckDto): Promise<{
    canAccommodate: boolean;
    availabilityByType: Record<WorkoutEquipmentType, EquipmentAvailabilityResponseDto>;
    totalRequirements: number;
    totalAvailable: number;
    conflicts: Array<{
      equipmentType: WorkoutEquipmentType;
      requiredCount: number;
      availableCount: number;
      shortfall: number;
    }>;
  }> {
    try {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);
      const availabilityByType: Record<WorkoutEquipmentType, EquipmentAvailabilityResponseDto> = {} as any;
      const conflicts: Array<{
        equipmentType: WorkoutEquipmentType;
        requiredCount: number;
        availableCount: number;
        shortfall: number;
      }> = [];

      let totalRequirements = 0;
      let totalAvailable = 0;
      let canAccommodate = true;

      // Check availability for each equipment type
      for (const requirement of dto.equipmentRequirements) {
        const availabilityCheck: AvailabilityCheckDto = {
          equipmentType: requirement.type,
          facilityId: dto.facilityId,
          startTime: dto.startTime,
          endTime: dto.endTime,
          requiredCount: requirement.count
        };

        const availability = await this.checkAvailability(availabilityCheck);
        availabilityByType[requirement.type] = availability;

        totalRequirements += requirement.count;
        totalAvailable += availability.availableCount;

        // Check if requirements can be met
        if (availability.availableCount < requirement.count) {
          canAccommodate = false;
          conflicts.push({
            equipmentType: requirement.type,
            requiredCount: requirement.count,
            availableCount: availability.availableCount,
            shortfall: requirement.count - availability.availableCount
          });
        }
      }

      const result = {
        canAccommodate,
        availabilityByType,
        totalRequirements,
        totalAvailable,
        conflicts
      };

      this.logger.debug(`Bulk availability check completed`, {
        facilityId: dto.facilityId,
        timeSlot: { startTime, endTime },
        canAccommodate,
        totalRequirements,
        totalAvailable,
        conflictCount: conflicts.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to check bulk equipment availability', error as Error, { dto });
      throw error;
    }
  }

  async getOptimalEquipmentAssignment(
    facilityId: string,
    equipmentRequirements: EquipmentRequirementDto[],
    startTime: Date,
    endTime: Date,
    playerIds?: string[]
  ): Promise<{
    isOptimal: boolean;
    assignments: Array<{
      equipmentType: WorkoutEquipmentType;
      assignedEquipment: Array<{
        equipmentId: string;
        equipmentName: string;
        playerId?: string;
        playerName?: string;
      }>;
    }>;
    unassignedPlayers: string[];
    alternativeSlots?: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
    }>;
  }> {
    try {
      const assignments: Array<{
        equipmentType: WorkoutEquipmentType;
        assignedEquipment: Array<{
          equipmentId: string;
          equipmentName: string;
          playerId?: string;
          playerName?: string;
        }>;
      }> = [];

      const availablePlayers = [...(playerIds || [])];
      let isOptimal = true;

      // Process each equipment type requirement
      for (const requirement of equipmentRequirements) {
        const availableEquipment = await this.inventoryService.findAvailableByType(
          facilityId,
          requirement.type,
          startTime,
          endTime
        );

        const assignedEquipment: Array<{
          equipmentId: string;
          equipmentName: string;
          playerId?: string;
          playerName?: string;
        }> = [];

        // Assign equipment up to the required count
        const assignmentCount = Math.min(requirement.count, availableEquipment.length);
        
        for (let i = 0; i < assignmentCount; i++) {
          const equipment = availableEquipment[i];
          const playerId = availablePlayers.shift(); // Assign next available player

          assignedEquipment.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            playerId,
            playerName: playerId ? `Player ${playerId.slice(-4)}` : undefined // Simplified for demo
          });
        }

        assignments.push({
          equipmentType: requirement.type,
          assignedEquipment
        });

        // Check if we could satisfy the full requirement
        if (assignmentCount < requirement.count) {
          isOptimal = false;
        }
      }

      // Generate alternative time slots if not optimal
      let alternativeSlots: Array<{
        startTime: Date;
        endTime: Date;
        duration: number;
      }> | undefined;

      if (!isOptimal) {
        alternativeSlots = await this.findAlternativeTimeSlots(
          facilityId,
          equipmentRequirements,
          startTime,
          endTime
        );
      }

      const result = {
        isOptimal,
        assignments,
        unassignedPlayers: availablePlayers,
        alternativeSlots
      };

      this.logger.debug(`Optimal equipment assignment completed`, {
        facilityId,
        timeSlot: { startTime, endTime },
        isOptimal,
        assignmentCount: assignments.length,
        unassignedPlayerCount: availablePlayers.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get optimal equipment assignment', error as Error, {
        facilityId,
        equipmentRequirements,
        startTime,
        endTime
      });
      throw error;
    }
  }

  async getRealTimeAvailability(facilityId: string): Promise<{
    timestamp: Date;
    equipmentStatus: Array<{
      equipmentType: WorkoutEquipmentType;
      totalCount: number;
      availableCount: number;
      inUseCount: number;
      maintenanceCount: number;
      reservedCount: number;
      utilizationRate: number;
    }>;
    activeReservations: Array<{
      equipmentId: string;
      equipmentName: string;
      equipmentType: WorkoutEquipmentType;
      sessionId: string;
      playerId?: string;
      startTime: Date;
      endTime: Date;
      status: ReservationStatus;
    }>;
  }> {
    try {
      const timestamp = new Date();
      
      // Get all equipment at the facility
      const allEquipment = await this.equipmentRepository.find({
        where: { facilityId, isActive: true },
        relations: ['reservations']
      });

      // Get active reservations
      const activeReservations = await this.reservationRepository.find({
        where: { 
          status: ReservationStatus.ACTIVE,
          reservedUntil: { } // Still active
        },
        relations: ['equipmentItem'],
        order: { reservedFrom: 'ASC' }
      });

      // Group equipment by type and calculate status
      const equipmentByType = new Map<WorkoutEquipmentType, EquipmentItem[]>();
      
      allEquipment.forEach(equipment => {
        if (!equipmentByType.has(equipment.type)) {
          equipmentByType.set(equipment.type, []);
        }
        equipmentByType.get(equipment.type)!.push(equipment);
      });

      const equipmentStatus = Array.from(equipmentByType.entries()).map(([type, equipment]) => {
        const totalCount = equipment.length;
        const availableCount = equipment.filter(e => e.status === EquipmentStatus.AVAILABLE).length;
        const inUseCount = equipment.filter(e => e.status === EquipmentStatus.IN_USE).length;
        const maintenanceCount = equipment.filter(e => e.status === EquipmentStatus.MAINTENANCE).length;
        const reservedCount = equipment.filter(e => e.status === EquipmentStatus.RESERVED).length;
        const utilizationRate = totalCount > 0 ? ((inUseCount + reservedCount) / totalCount) * 100 : 0;

        return {
          equipmentType: type,
          totalCount,
          availableCount,
          inUseCount,
          maintenanceCount,
          reservedCount,
          utilizationRate
        };
      });

      const reservationData = activeReservations
        .filter(reservation => reservation.equipmentItem?.facilityId === facilityId)
        .map(reservation => ({
          equipmentId: reservation.equipmentItemId,
          equipmentName: reservation.equipmentItem.name,
          equipmentType: reservation.equipmentItem.type,
          sessionId: reservation.sessionId,
          playerId: reservation.playerId,
          startTime: reservation.reservedFrom,
          endTime: reservation.reservedUntil,
          status: reservation.status
        }));

      const result = {
        timestamp,
        equipmentStatus,
        activeReservations: reservationData
      };

      this.logger.debug(`Real-time availability retrieved`, {
        facilityId,
        equipmentTypeCount: equipmentStatus.length,
        activeReservationCount: reservationData.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get real-time availability', error as Error, { facilityId });
      throw error;
    }
  }

  private async getConflictsForTimeSlot(
    facilityId: string,
    equipmentType: WorkoutEquipmentType,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{
    equipmentItemId: string;
    conflictStart: Date;
    conflictEnd: Date;
    reservedBy?: string;
  }>> {
    try {
      const conflicts = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.equipmentItem', 'equipment')
        .where('equipment.facilityId = :facilityId', { facilityId })
        .andWhere('equipment.type = :equipmentType', { equipmentType })
        .andWhere('reservation.status = :status', { status: ReservationStatus.ACTIVE })
        .andWhere(
          '(reservation.reservedFrom < :endTime AND reservation.reservedUntil > :startTime)',
          { startTime, endTime }
        )
        .getMany();

      return conflicts.map(conflict => ({
        equipmentItemId: conflict.equipmentItemId,
        conflictStart: conflict.reservedFrom,
        conflictEnd: conflict.reservedUntil,
        reservedBy: conflict.reservedBy
      }));
    } catch (error) {
      this.logger.error('Failed to get conflicts for time slot', error as Error, {
        facilityId,
        equipmentType,
        startTime,
        endTime
      });
      return [];
    }
  }

  private async findAlternativeTimeSlots(
    facilityId: string,
    equipmentRequirements: EquipmentRequirementDto[],
    originalStart: Date,
    originalEnd: Date
  ): Promise<Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
  }>> {
    try {
      const sessionDuration = originalEnd.getTime() - originalStart.getTime();
      const alternatives: Array<{
        startTime: Date;
        endTime: Date;
        duration: number;
      }> = [];

      // Search for alternative slots within the same day
      const searchStart = new Date(originalStart);
      searchStart.setHours(6, 0, 0, 0); // Start at 6 AM
      
      const searchEnd = new Date(originalStart);
      searchEnd.setHours(22, 0, 0, 0); // End at 10 PM

      // Check slots every 30 minutes
      const slotInterval = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      for (let currentTime = searchStart.getTime(); currentTime <= searchEnd.getTime() - sessionDuration; currentTime += slotInterval) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime + sessionDuration);

        // Skip the original time slot
        if (slotStart.getTime() === originalStart.getTime()) {
          continue;
        }

        // Check if this slot can accommodate all requirements
        const bulkCheck = await this.checkBulkAvailability({
          facilityId,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          equipmentRequirements
        });

        if (bulkCheck.canAccommodate) {
          alternatives.push({
            startTime: slotStart,
            endTime: slotEnd,
            duration: sessionDuration / (1000 * 60) // Convert to minutes
          });

          // Limit to 5 alternatives
          if (alternatives.length >= 5) {
            break;
          }
        }
      }

      this.logger.debug(`Found ${alternatives.length} alternative time slots`, {
        facilityId,
        originalSlot: { originalStart, originalEnd },
        alternativeCount: alternatives.length
      });

      return alternatives;
    } catch (error) {
      this.logger.error('Failed to find alternative time slots', error as Error, {
        facilityId,
        equipmentRequirements
      });
      return [];
    }
  }
}