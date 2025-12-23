// @ts-nocheck - File DTOs with class-validator decorators
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsArray, IsUUID, IsDateString, Min, Max, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { FileCategory, FileStatus } from '../entities/File';
import { ShareType, SharePermission } from '../entities/FileShare';

export class FileUploadDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

export class FileSearchDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minSize?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxSize?: number;

  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'size', 'name', 'accessCount'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class FileShareDto {
  @IsOptional()
  @IsUUID()
  sharedWithId?: string;

  @IsEnum(ShareType)
  shareType: ShareType;

  @IsOptional()
  @IsArray()
  @IsEnum(SharePermission, { each: true })
  permissions?: SharePermission[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  maxAccessCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class FileUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublic?: boolean;
}

export class SignedUrlDto {
  @IsOptional()
  @IsEnum(['upload', 'download'])
  action?: 'upload' | 'download';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(60)
  @Max(604800) // Max 7 days
  expiresIn?: number;
}