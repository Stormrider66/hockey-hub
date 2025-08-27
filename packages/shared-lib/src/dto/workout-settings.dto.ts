import { IsOptional, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';

export class WorkoutSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowIndividualLoads?: boolean = true;

  @IsOptional()
  // Using string union check to avoid enum evaluation order issues
  @IsIn(['grid', 'focus', 'tv'])
  displayMode?: 'grid' | 'focus' | 'tv' = 'grid';

  @IsOptional()
  @IsBoolean()
  showMetrics?: boolean = true;

  @IsOptional()
  @IsBoolean()
  autoRotation?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  rotationInterval?: number = 30;
}





