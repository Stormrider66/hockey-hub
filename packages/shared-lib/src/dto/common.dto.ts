import { IsInt, IsOptional, Min, Max, IsString, IsIn, IsArray, IsEnum, IsDateString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';
}

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filters?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class IdParamDto {
  @IsUUID('4', { message: 'Invalid ID format' })
  id!: string;
}

export class IdsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}

export class BulkOperationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsString()
  @IsIn(['activate', 'deactivate', 'delete', 'archive'])
  operation!: string;
}

export class DateRangeDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month', 'year'])
  groupBy?: string;
}

export class FileUploadDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(100)
  mimetype!: string;

  @IsInt()
  @Min(1)
  @Max(52428800) // 50MB
  size!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class NotificationDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsString()
  @IsIn(['info', 'success', 'warning', 'error'])
  type?: string = 'info';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recipientIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actionUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionLabel?: string;
}

