import { IsNumber, IsOptional, IsEnum, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageSizeDto {
  @IsNumber()
  @Min(1)
  @Max(5000)
  width: number;

  @IsNumber()
  @Min(1)
  @Max(5000)
  height: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @IsOptional()
  @IsEnum(['thumbnail', 'small', 'medium', 'large', 'custom'])
  name?: string;
}

export class ImageCropDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  left: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  top: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  width: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  height: number;
}

export class ImageResizeDto {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  width: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  height: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  quality?: number;
}

export class ImageConvertDto {
  @IsEnum(['jpeg', 'png', 'webp'])
  format: 'jpeg' | 'png' | 'webp';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  quality?: number;
}

export class ImageProcessDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageSizeDto)
  sizes?: ImageSizeDto[];
}