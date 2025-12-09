import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib';
import { EquipmentReservation, ReservationStatus } from '../entities/EquipmentReservation';
import { EquipmentItem, EquipmentStatus } from '../entities/EquipmentItem';
import { 
  CreateEquipmentReservationDto, 
  BulkReservationDto, 
  UpdateReservationStatusDto,
  CheckInOutDto,
  ConflictCheckResponseDto
} from '../dto/equipment.dto';
import { AppDataSource } from '../config/database';
import { EquipmentInventoryService } from './EquipmentInventoryService';

export class EquipmentReservationService {
  private readonly logger = new Logger('EquipmentReservationService');
  private readonly reservationRepository: Repository<EquipmentReservation>;
  private readonly equipmentRepository: Repository<EquipmentItem>;
  private readonly inventoryService: EquipmentInventoryService;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(EquipmentReservation);
    this.equipmentRepository = AppDataSource.getRepository(EquipmentItem);
    this.inventoryService = new EquipmentInventoryService();
  }

  async createReservation(dto: CreateEquipmentReservationDto, userId: string): Promise<EquipmentReservation> {
    try {
      const startTime = new Date(dto.reservedFrom);
      const endTime = new Date(dto.reservedUntil);

      // Check if equipment exists and is available
      const equipment = await this.inventoryService.findById(dto.equipmentItemId);
      if (!equipment) {
        throw new Error(`Equipment item not found: ${dto.equipmentItemId}`);
      }

      if (equipment.status !== EquipmentStatus.AVAILABLE) {
        throw new Error(`Equipment is not available for reservation: ${equipment.status}`);
      }

      // Check for conflicts
      const conflicts = await this.checkConflicts(dto.equipmentItemId, startTime, endTime);
      if (conflicts.hasConflicts) {
        throw new Error(`Equipment conflicts exist for the requested time slot`);
      }

      const reservation = this.reservationRepository.create({
        ...dto,
        reservedFrom: startTime,
        reservedUntil: endTime,
        reservedBy: userId
      });

      const saved = await this.reservationRepository.save(reservation);

      // Update equipment status to reserved
      await this.inventoryService.updateStatus(
        dto.equipmentItemId, 
        EquipmentStatus.RESERVED, 
        userId,
        `Reserved for session ${dto.sessionId}`
      );

      this.logger.info(`Created equipment reservation: ${saved.id}`, { 
        reservationId: saved.id,
        equipmentId: dto.equipmentItemId,
        sessionId: dto.sessionId,
        userId 
      });
      
      return saved;
    } catch (error) {
      this.logger.error('Failed to create equipment reservation', error as Error, { userId, dto });
      throw error;
    }
  }

  async createBulkReservations(dto: BulkReservationDto, userId: string): Promise<EquipmentReservation[]> {
    try {
      const startTime = new Date(dto.reservedFrom);
      const endTime = new Date(dto.reservedUntil);
      const reservations: EquipmentReservation[] = [];

      // Check availability for all equipment
      for (const equipmentId of dto.equipmentItemIds) {
        const equipment = await this.inventoryService.findById(equipmentId);
        if (!equipment) {
          throw new Error(`Equipment item not found: ${equipmentId}`);
        }

        if (equipment.status !== EquipmentStatus.AVAILABLE) {
          throw new Error(`Equipment ${equipment.name} is not available: ${equipment.status}`);
        }

        const conflicts = await this.checkConflicts(equipmentId, startTime, endTime);
        if (conflicts.hasConflicts) {
          throw new Error(`Equipment ${equipment.name} has conflicts for the requested time slot`);
        }
      }

      // Create reservations
      for (let i = 0; i < dto.equipmentItemIds.length; i++) {
        const equipmentId = dto.equipmentItemIds[i];
        const playerId = dto.playerIds?.[i]; // Optional player assignment

        const reservation = this.reservationRepository.create({
          equipmentItemId: equipmentId,
          sessionId: dto.sessionId,
          playerId,
          reservedFrom: startTime,
          reservedUntil: endTime,
          reservedBy: userId,
          notes: dto.notes
        });

        const saved = await this.reservationRepository.save(reservation);
        reservations.push(saved);

        // Update equipment status
        await this.inventoryService.updateStatus(
          equipmentId, 
          EquipmentStatus.RESERVED, 
          userId,
          `Reserved for session ${dto.sessionId}`
        );
      }

      this.logger.info(`Created ${reservations.length} bulk reservations`, { 
        sessionId: dto.sessionId,
        equipmentCount: dto.equipmentItemIds.length,
        userId 
      });
      
      return reservations;
    } catch (error) {
      this.logger.error('Failed to create bulk reservations', error as Error, { userId, dto });
      throw error;
    }
  }

  async findBySession(sessionId: string): Promise<EquipmentReservation[]> {
    try {
      const reservations = await this.reservationRepository.find({
        where: { sessionId },
        relations: ['equipmentItem'],
        order: { reservedFrom: 'ASC' }
      });

      this.logger.debug(`Found ${reservations.length} reservations for session`, { sessionId });
      return reservations;
    } catch (error) {
      this.logger.error('Failed to fetch reservations by session', error as Error, { sessionId });
      throw error;
    }
  }

  async findByPlayer(playerId: string, startDate?: Date, endDate?: Date): Promise<EquipmentReservation[]> {
    try {
      const where: FindOptionsWhere<EquipmentReservation> = { playerId };

      if (startDate) {
        where.reservedFrom = MoreThanOrEqual(startDate);
      }

      if (endDate) {
        where.reservedUntil = LessThanOrEqual(endDate);
      }

      const reservations = await this.reservationRepository.find({
        where,
        relations: ['equipmentItem'],
        order: { reservedFrom: 'DESC' }
      });

      this.logger.debug(`Found ${reservations.length} reservations for player`, { 
        playerId, 
        startDate, 
        endDate 
      });
      return reservations;
    } catch (error) {
      this.logger.error('Failed to fetch reservations by player', error as Error, { 
        playerId, 
        startDate, 
        endDate 
      });
      throw error;
    }
  }

  async findActiveReservations(facilityId?: string): Promise<EquipmentReservation[]> {
    try {
      const query = this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.equipmentItem', 'equipment')
        .where('reservation.status = :status', { status: ReservationStatus.ACTIVE })
        .andWhere('reservation.reservedUntil > :now', { now: new Date() });

      if (facilityId) {
        query.andWhere('equipment.facilityId = :facilityId', { facilityId });
      }

      const reservations = await query
        .orderBy('reservation.reservedFrom', 'ASC')
        .getMany();

      this.logger.debug(`Found ${reservations.length} active reservations`, { facilityId });
      return reservations;
    } catch (error) {
      this.logger.error('Failed to fetch active reservations', error as Error, { facilityId });
      throw error;
    }
  }

  async updateStatus(
    id: string, 
    dto: UpdateReservationStatusDto, 
    userId: string
  ): Promise<EquipmentReservation | null> {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      if (!reservation) {
        this.logger.warn(`Reservation not found: ${id}`);
        return null;
      }

      const oldStatus = reservation.status;
      await this.reservationRepository.update(id, {
        status: dto.status,
        notes: dto.notes || reservation.notes,
        sessionData: dto.sessionData || reservation.sessionData
      });

      // Update equipment status based on reservation status
      if (dto.status === ReservationStatus.COMPLETED || dto.status === ReservationStatus.CANCELLED) {
        await this.inventoryService.updateStatus(
          reservation.equipmentItemId,
          EquipmentStatus.AVAILABLE,
          userId,
          `Reservation ${dto.status.toLowerCase()}`
        );
      } else if (dto.status === ReservationStatus.ACTIVE && oldStatus !== ReservationStatus.ACTIVE) {
        await this.inventoryService.updateStatus(
          reservation.equipmentItemId,
          EquipmentStatus.IN_USE,
          userId,
          'Reservation activated'
        );
      }

      const updated = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      this.logger.info(`Updated reservation status: ${id}`, { 
        reservationId: id,
        oldStatus,
        newStatus: dto.status,
        userId
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to update reservation status', error as Error, { id, dto, userId });
      throw error;
    }
  }

  async checkIn(id: string, dto: CheckInOutDto, userId: string): Promise<EquipmentReservation | null> {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      if (!reservation) {
        this.logger.warn(`Reservation not found for check-in: ${id}`);
        return null;
      }

      if (!reservation.canCheckIn()) {
        throw new Error('Reservation cannot be checked in at this time');
      }

      const checkInTime = dto.timestamp ? new Date(dto.timestamp) : new Date();
      
      await this.reservationRepository.update(id, {
        checkInTime,
        notes: dto.notes || reservation.notes
      });

      // Update equipment status to in use
      await this.inventoryService.updateStatus(
        reservation.equipmentItemId,
        EquipmentStatus.IN_USE,
        userId,
        'Equipment checked in'
      );

      const updated = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      this.logger.info(`Equipment checked in: ${id}`, { 
        reservationId: id,
        checkInTime,
        userId
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to check in equipment', error as Error, { id, dto, userId });
      throw error;
    }
  }

  async checkOut(id: string, dto: CheckInOutDto, userId: string): Promise<EquipmentReservation | null> {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      if (!reservation) {
        this.logger.warn(`Reservation not found for check-out: ${id}`);
        return null;
      }

      if (!reservation.canCheckOut()) {
        throw new Error('Reservation cannot be checked out at this time');
      }

      const checkOutTime = dto.timestamp ? new Date(dto.timestamp) : new Date();
      
      await this.reservationRepository.update(id, {
        checkOutTime,
        notes: dto.notes || reservation.notes,
        status: ReservationStatus.COMPLETED
      });

      // Update equipment status to available
      await this.inventoryService.updateStatus(
        reservation.equipmentItemId,
        EquipmentStatus.AVAILABLE,
        userId,
        'Equipment checked out'
      );

      const updated = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      this.logger.info(`Equipment checked out: ${id}`, { 
        reservationId: id,
        checkOutTime,
        actualDuration: updated?.actualDuration,
        userId
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to check out equipment', error as Error, { id, dto, userId });
      throw error;
    }
  }

  async cancelReservation(id: string, userId: string, reason?: string): Promise<EquipmentReservation | null> {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      if (!reservation) {
        this.logger.warn(`Reservation not found for cancellation: ${id}`);
        return null;
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new Error(`Cannot cancel reservation with status: ${reservation.status}`);
      }

      await this.reservationRepository.update(id, {
        status: ReservationStatus.CANCELLED,
        notes: reason || reservation.notes
      });

      // Update equipment status to available
      await this.inventoryService.updateStatus(
        reservation.equipmentItemId,
        EquipmentStatus.AVAILABLE,
        userId,
        `Reservation cancelled: ${reason || 'No reason provided'}`
      );

      const updated = await this.reservationRepository.findOne({
        where: { id },
        relations: ['equipmentItem']
      });

      this.logger.info(`Reservation cancelled: ${id}`, { 
        reservationId: id,
        reason,
        userId
      });
      
      return updated;
    } catch (error) {
      this.logger.error('Failed to cancel reservation', error as Error, { id, userId, reason });
      throw error;
    }
  }

  async checkConflicts(
    equipmentItemId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeReservationId?: string
  ): Promise<ConflictCheckResponseDto> {
    try {
      const query = this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.equipmentItem', 'equipment')
        .where('reservation.equipmentItemId = :equipmentItemId', { equipmentItemId })
        .andWhere('reservation.status = :status', { status: ReservationStatus.ACTIVE })
        .andWhere(
          '(reservation.reservedFrom < :endTime AND reservation.reservedUntil > :startTime)',
          { startTime, endTime }
        );

      if (excludeReservationId) {
        query.andWhere('reservation.id != :excludeId', { excludeId: excludeReservationId });
      }

      const conflictingReservations = await query.getMany();

      const conflicts = conflictingReservations.map(reservation => ({
        equipmentItemId: reservation.equipmentItemId,
        equipmentName: reservation.equipmentItem.name,
        conflictStart: reservation.reservedFrom,
        conflictEnd: reservation.reservedUntil,
        sessionId: reservation.sessionId,
        playerId: reservation.playerId,
        reservedBy: reservation.reservedBy
      }));

      const result: ConflictCheckResponseDto = {
        hasConflicts: conflicts.length > 0,
        conflicts
      };

      this.logger.debug(`Conflict check completed`, { 
        equipmentItemId,
        timeSlot: { startTime, endTime },
        conflictCount: conflicts.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to check conflicts', error as Error, { 
        equipmentItemId, 
        startTime, 
        endTime 
      });
      throw error;
    }
  }

  async getReservationStats(facilityId: string, startDate: Date, endDate: Date): Promise<{
    totalReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    noShowReservations: number;
    averageUsageDuration: number;
    utilizationRate: number;
  }> {
    try {
      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.equipmentItem', 'equipment')
        .where('equipment.facilityId = :facilityId', { facilityId })
        .andWhere('reservation.reservedFrom >= :startDate', { startDate })
        .andWhere('reservation.reservedUntil <= :endDate', { endDate })
        .getMany();

      const totalReservations = reservations.length;
      const completedReservations = reservations.filter(r => r.status === ReservationStatus.COMPLETED).length;
      const cancelledReservations = reservations.filter(r => r.status === ReservationStatus.CANCELLED).length;
      const noShowReservations = reservations.filter(r => r.status === ReservationStatus.NO_SHOW).length;

      const completedWithDuration = reservations.filter(r => 
        r.status === ReservationStatus.COMPLETED && r.actualDuration > 0
      );
      
      const averageUsageDuration = completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, r) => sum + r.actualDuration, 0) / completedWithDuration.length
        : 0;

      const utilizationRate = totalReservations > 0 
        ? (completedReservations / totalReservations) * 100 
        : 0;

      const stats = {
        totalReservations,
        completedReservations,
        cancelledReservations,
        noShowReservations,
        averageUsageDuration,
        utilizationRate
      };

      this.logger.debug(`Generated reservation stats`, { facilityId, startDate, endDate, stats });
      return stats;
    } catch (error) {
      this.logger.error('Failed to generate reservation stats', error as Error, { 
        facilityId, 
        startDate, 
        endDate 
      });
      throw error;
    }
  }
}