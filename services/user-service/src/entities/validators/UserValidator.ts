// @ts-nocheck - Complex validators need refactoring
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { AppDataSource } from '../../config/database';
import { User } from '../User';

// Check if email is unique in database
@ValidatorConstraint({ async: true })
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    
    // If updating, exclude current user
    if (args.object && (args.object as any).id) {
      return !user || user.id === (args.object as any).id;
    }
    
    return !user;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Email $value is already registered';
  }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}

// Check jersey number uniqueness within team
@ValidatorConstraint({ async: true })
export class IsJerseyNumberUniqueInTeamConstraint implements ValidatorConstraintInterface {
  async validate(jerseyNumber: number, args: ValidationArguments): Promise<boolean> {
    const object = args.object as any;
    if (!object.teamId || !jerseyNumber) return true;

    const query = AppDataSource
      .createQueryBuilder('team_members', 'tm')
      .where('tm.teamId = :teamId', { teamId: object.teamId })
      .andWhere('tm.jerseyNumber = :jerseyNumber', { jerseyNumber })
      .andWhere('tm.isActive = true');

    // Exclude current member if updating
    if (object.userId) {
      query.andWhere('tm.userId != :userId', { userId: object.userId });
    }

    const existingMember = await query.getOne();
    return !existingMember;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Jersey number $value is already taken in this team';
  }
}

export function IsJerseyNumberUniqueInTeam(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJerseyNumberUniqueInTeamConstraint,
    });
  };
}

// Validate age for role
@ValidatorConstraint({ async: false })
export class IsValidAgeForRoleConstraint implements ValidatorConstraintInterface {
  validate(dateOfBirth: Date, args: ValidationArguments): boolean {
    const object = args.object as any;
    if (!dateOfBirth || !object.role) return true;

    const age = this.calculateAge(dateOfBirth);
    
    switch (object.role) {
      case 'player':
        return age >= 5 && age <= 65;
      case 'coach':
      case 'assistant_coach':
        return age >= 18;
      case 'parent':
        return age >= 21;
      case 'medical_staff':
      case 'admin':
        return age >= 18;
      default:
        return true;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    const object = args.object as any;
    return `Age requirements not met for role ${object.role}`;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export function IsValidAgeForRole(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAgeForRoleConstraint,
    });
  };
}

// Validate parent can only be linked to minors
@ValidatorConstraint({ async: true })
export class IsValidParentChildRelationshipConstraint implements ValidatorConstraintInterface {
  async validate(childUserId: string, args: ValidationArguments): Promise<boolean> {
    const object = args.object as any;
    if (!childUserId || !object.parentUserId) return true;

    const userRepository = AppDataSource.getRepository(User);
    
    // Get both users
    const [parent, child] = await Promise.all([
      userRepository.findOne({ where: { id: object.parentUserId } }),
      userRepository.findOne({ where: { id: childUserId } }),
    ]);

    if (!parent || !child) return false;

    // Calculate ages
    const parentAge = this.calculateAge(parent.dateOfBirth!);
    const childAge = this.calculateAge(child.dateOfBirth!);

    // Parent must be at least 18 years older than child
    if (parentAge - childAge < 18) return false;

    // Child must be under 18
    if (childAge >= 18) return false;

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Invalid parent-child relationship';
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export function IsValidParentChildRelationship(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidParentChildRelationshipConstraint,
    });
  };
}