import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  IsNotEmpty,
  IsBoolean,
  IsUrl,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { IsUUID, IsAgeGroup } from '../decorators';

export enum TeamType {
  YOUTH = 'youth',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  RECREATIONAL = 'recreational',
}

export class CreateTeamValidation {
  @IsUUID()
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Team name is required' })
  @Length(2, 255, { message: 'Team name must be between 2 and 255 characters' })
  name: string;

  @IsEnum(TeamType)
  @IsNotEmpty({ message: 'Team type is required' })
  teamType: TeamType;

  @IsOptional()
  @IsAgeGroup()
  ageGroup?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}(-\d{4})?$/, { 
    message: 'Season must be in format YYYY or YYYY-YYYY' 
  })
  season?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid logo URL' })
  @Length(0, 500)
  logoUrl?: string;
}

export class UpdateTeamValidation {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsEnum(TeamType)
  teamType?: TeamType;

  @IsOptional()
  @IsAgeGroup()
  ageGroup?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}(-\d{4})?$/)
  season?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 500)
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TeamRosterValidation {
  @IsOptional()
  @IsInt()
  @Min(10, { message: 'Minimum roster size is 10 players' })
  @Max(50, { message: 'Maximum roster size is 50 players' })
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(50)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minCoaches?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxCoaches?: number;
}

export class TeamScheduleValidation {
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Practice time must be in HH:MM format'
  })
  defaultPracticeTime?: string;

  @IsOptional()
  @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
    each: true,
    message: 'Invalid day of week'
  })
  practiceDays?: string[];

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(180)
  practiceDurationMinutes?: number;

  @IsOptional()
  @IsUUID()
  defaultLocationId?: string;
}