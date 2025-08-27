import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { IsSubdomain, IsHexColor } from '../decorators';

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export class CreateOrganizationValidation {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  @Length(3, 255, { message: 'Organization name must be between 3 and 255 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Subdomain is required' })
  @Length(3, 100, { message: 'Subdomain must be between 3 and 100 characters' })
  @IsSubdomain({ message: 'Invalid subdomain format' })
  subdomain: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid logo URL' })
  @Length(0, 500)
  logoUrl?: string;

  @IsOptional()
  @IsHexColor({ message: 'Primary color must be a valid hex color' })
  primaryColor?: string;

  @IsOptional()
  @IsHexColor({ message: 'Secondary color must be a valid hex color' })
  secondaryColor?: string;

  @IsOptional()
  @IsEnum(SubscriptionTier, { message: 'Invalid subscription tier' })
  subscriptionTier?: SubscriptionTier;
}

export class UpdateOrganizationValidation {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  name?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 500)
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubscriptionValidation {
  @IsEnum(SubscriptionTier)
  @IsNotEmpty()
  tier: SubscriptionTier;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class OrganizationSettingsValidation {
  @IsOptional()
  @IsBoolean()
  allowPlayerRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  requireParentApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePayments?: boolean;

  @IsOptional()
  @IsBoolean()
  enableMedicalTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTrainingPlans?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}