import { IsString, IsOptional, IsEnum, IsUUID, IsDate, IsInt, Min, Max, MaxLength, IsObject, IsBoolean, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WorkoutEquipmentType, EquipmentStatus } from '../entities/EquipmentItem';
import { ReservationStatus } from '../entities/EquipmentReservation';

// Equipment Item DTOs
export class CreateEquipmentItemDto {
  @IsEnum(WorkoutEquipmentType)
  type!: WorkoutEquipmentType;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serialNumber?: string;

  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus = EquipmentStatus.AVAILABLE;

  @IsUUID(4)
  facilityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsObject()
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    maxWeight?: number;
    maxSpeed?: number;
    features?: string[];
  };
}

export class UpdateEquipmentItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serialNumber?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsObject()
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    maxWeight?: number;
    maxSpeed?: number;
    features?: string[];
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EquipmentFilterDto {
  @IsOptional()
  @IsEnum(WorkoutEquipmentType)
  type?: WorkoutEquipmentType;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsUUID(4)
  facilityId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;
}

// Equipment Reservation DTOs
export class CreateEquipmentReservationDto {
  @IsUUID(4)
  equipmentItemId!: string;

  @IsUUID(4)
  sessionId!: string;

  @IsOptional()
  @IsUUID(4)
  playerId?: string;

  @IsDateString()
  reservedFrom!: string;

  @IsDateString()
  reservedUntil!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkReservationDto {
  @IsUUID(4)
  sessionId!: string;

  @IsArray()
  @IsUUID(4, { each: true })
  equipmentItemIds!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  playerIds?: string[];

  @IsDateString()
  reservedFrom!: string;

  @IsDateString()
  reservedUntil!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  sessionData?: {
    actualStartTime?: Date;
    actualEndTime?: Date;
    metricsRecorded?: boolean;
    issuesReported?: string[];
    performanceNotes?: string;
  };
}

export class CheckInOutDto {
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Availability Check DTOs
export class AvailabilityCheckDto {
  @IsEnum(WorkoutEquipmentType)
  equipmentType!: WorkoutEquipmentType;

  @IsUUID(4)
  facilityId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  requiredCount?: number = 1;
}

export class BulkAvailabilityCheckDto {
  @IsUUID(4)
  facilityId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentRequirementDto)
  equipmentRequirements!: EquipmentRequirementDto[];
}

export class EquipmentRequirementDto {
  @IsEnum(WorkoutEquipmentType)
  type!: WorkoutEquipmentType;

  @IsInt()
  @Min(1)
  count!: number;
}

// Facility Equipment Config DTOs
export class CreateFacilityEquipmentConfigDto {
  @IsUUID(4)
  facilityId!: string;

  @IsEnum(WorkoutEquipmentType)
  equipmentType!: WorkoutEquipmentType;

  @IsInt()
  @Min(0)
  totalCount!: number;

  @IsString()
  @MaxLength(255)
  defaultLocation!: string;

  @IsOptional()
  @IsObject()
  configuration?: {
    maxSessionDuration?: number;
    bufferTime?: number;
    maintenanceInterval?: number;
    autoAssignment?: boolean;
    bookingRules?: {
      maxAdvanceBooking?: number;
      minAdvanceBooking?: number;
      allowWalkIn?: boolean;
      requireApproval?: boolean;
    };
    operatingHours?: {
      [key: string]: { start: string; end: string };
    };
  };

  @IsOptional()
  @IsObject()
  restrictions?: {
    userTypes?: string[];
    maxUsersPerEquipment?: number;
    trainingRequired?: boolean;
    ageRestrictions?: {
      minimum?: number;
      maximum?: number;
    };
    medicalClearanceRequired?: boolean;
  };
}

export class UpdateFacilityEquipmentConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  totalCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultLocation?: string;

  @IsOptional()
  @IsObject()
  configuration?: {
    maxSessionDuration?: number;
    bufferTime?: number;
    maintenanceInterval?: number;
    autoAssignment?: boolean;
    bookingRules?: {
      maxAdvanceBooking?: number;
      minAdvanceBooking?: number;
      allowWalkIn?: boolean;
      requireApproval?: boolean;
    };
    operatingHours?: {
      [key: string]: { start: string; end: string };
    };
  };

  @IsOptional()
  @IsObject()
  restrictions?: {
    userTypes?: string[];
    maxUsersPerEquipment?: number;
    trainingRequired?: boolean;
    ageRestrictions?: {
      minimum?: number;
      maximum?: number;
    };
    medicalClearanceRequired?: boolean;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID(4)
  managedBy?: string;
}

// Response DTOs
export class EquipmentAvailabilityResponseDto {
  equipmentType: WorkoutEquipmentType;
  facilityId: string;
  totalCount: number;
  availableCount: number;
  availableItems: Array<{
    id: string;
    name: string;
    location?: string;
    status: EquipmentStatus;
  }>;
  conflicts?: Array<{
    equipmentItemId: string;
    conflictStart: Date;
    conflictEnd: Date;
    reservedBy?: string;
  }>;
}

export class ConflictCheckResponseDto {
  hasConflicts: boolean;
  conflicts: Array<{
    equipmentItemId: string;
    equipmentName: string;
    conflictStart: Date;
    conflictEnd: Date;
    sessionId: string;
    playerId?: string;
    reservedBy: string;
  }>;
  suggestions?: Array<{
    equipmentItemId: string;
    equipmentName: string;
    availableSlots: Array<{
      start: Date;
      end: Date;
    }>;
  }>;
}