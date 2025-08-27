import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsInt, Min, Max, IsBoolean, IsNumber, MaxLength, ArrayMaxSize } from 'class-validator';
// import { Type } from 'class-transformer';

// Enums for medical data
export enum RecoveryStatus {
  ACTIVE = 'active',
  RECOVERING = 'recovering',
  RECOVERED = 'recovered'
}

// Injury DTOs
export class CreateInjuryDto {
  @IsInt()
  playerId!: number;

  @IsString()
  @MaxLength(255)
  injuryType!: string;

  @IsDateString()
  injuryDate!: string;

  @IsEnum(RecoveryStatus)
  @IsOptional()
  recoveryStatus?: RecoveryStatus = RecoveryStatus.ACTIVE;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  severityLevel!: number;

  @IsString()
  @MaxLength(100)
  bodyPart!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mechanismOfInjury?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateInjuryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  injuryType?: string;

  @IsOptional()
  @IsDateString()
  injuryDate?: string;

  @IsOptional()
  @IsEnum(RecoveryStatus)
  recoveryStatus?: RecoveryStatus;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  severityLevel?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bodyPart?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mechanismOfInjury?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Wellness DTOs
export class CreateWellnessEntryDto {
  @IsInt()
  @IsOptional() // Will be set from params in route
  playerId?: number;

  @IsDateString()
  entryDate!: string;

  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  sleepQuality!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  energyLevel!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  sorenessLevel!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  hydrationLevel!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  nutritionQuality!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  moodRating!: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  restingHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  hrvScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  bodyWeight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  painAreas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  medications?: string[];
}

// Player Availability DTOs
export class CreatePlayerAvailabilityDto {
  @IsInt()
  playerId!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsEnum(['available', 'injured', 'suspended', 'sick', 'personal'])
  status!: 'available' | 'injured' | 'suspended' | 'sick' | 'personal';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsInt()
  injuryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdatePlayerAvailabilityDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['available', 'injured', 'suspended', 'sick', 'personal'])
  status?: 'available' | 'injured' | 'suspended' | 'sick' | 'personal';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsInt()
  injuryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// Treatment DTOs
export class CreateTreatmentDto {
  @IsInt()
  injuryId!: number;

  @IsDateString()
  treatmentDate!: string;

  @IsString()
  @MaxLength(255)
  treatmentType!: string;

  @IsString()
  @MaxLength(100)
  provider!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  effectiveness?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  followUpInstructions?: string;
}

// Medical Report DTOs
export class CreateMedicalReportDto {
  @IsInt()
  playerId!: number;

  @IsOptional()
  @IsInt()
  injuryId?: number;

  @IsDateString()
  reportDate!: string;

  @IsString()
  @MaxLength(255)
  reportType!: string;

  @IsString()
  @MaxLength(100)
  doctor!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

// Wellness Date Range Query DTO
export class WellnessDateRangeDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}