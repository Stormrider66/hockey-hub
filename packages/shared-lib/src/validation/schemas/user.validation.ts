import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Length,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import {
  IsUUID,
  IsPhoneNumber,
  IsJerseyNumber,
  IsValidDateOfBirth,
  IsStrongPassword,
  IsUniqueEmail,
} from '../decorators';

export enum Handedness {
  LEFT = 'left',
  RIGHT = 'right',
  AMBIDEXTROUS = 'ambidextrous',
}

export enum UserRole {
  PLAYER = 'player',
  COACH = 'coach',
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
  PARENT = 'parent',
  MEDICAL_STAFF = 'medical_staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export class CreateUserValidation {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsUniqueEmail({ message: 'Email already exists' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
  lastName: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsDateString()
  @IsValidDateOfBirth()
  dateOfBirth?: string;

  @IsOptional()
  @IsJerseyNumber()
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  position?: string;

  @IsOptional()
  @IsEnum(Handedness, { message: 'Invalid handedness value' })
  handedness?: Handedness;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Profile image URL too long' })
  profileImageUrl?: string;
}

export class UpdateUserValidation {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsDateString()
  @IsValidDateOfBirth()
  dateOfBirth?: string;

  @IsOptional()
  @IsJerseyNumber()
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  position?: string;

  @IsOptional()
  @IsEnum(Handedness)
  handedness?: Handedness;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  profileImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordValidation {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @IsStrongPassword()
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}

export class GetUsersQueryValidation {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['firstName', 'lastName', 'email', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class AddUserToOrganizationValidation {
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

export class AddUserToTeamValidation {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['player', 'coach', 'assistant_coach', 'team_manager', 'medical_staff'])
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsJerseyNumber()
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  position?: string;
}

export class BulkUserOperationValidation {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 users per operation' })
  @IsUUID({ each: true })
  userIds: string[];
}

export class ParentChildRelationshipValidation {
  @IsUUID()
  @IsNotEmpty()
  parentUserId: string;

  @IsUUID()
  @IsNotEmpty()
  childUserId: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  relationshipType?: string;

  @IsOptional()
  @IsBoolean()
  isPrimaryContact?: boolean;
}