import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Custom validator for UUID format
@ValidatorConstraint({ async: false })
export class IsUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid UUID`;
  }
}

export function IsUUID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUUIDConstraint,
    });
  };
}

// Custom validator for phone numbers
@ValidatorConstraint({ async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value) return true; // Optional field
    // Support various phone formats
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
    return typeof value === 'string' && phoneRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid phone number`;
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}

// Custom validator for jersey numbers
@ValidatorConstraint({ async: false })
export class IsJerseyNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value) return true; // Optional field
    return typeof value === 'number' && value >= 1 && value <= 99;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be between 1 and 99`;
  }
}

export function IsJerseyNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJerseyNumberConstraint,
    });
  };
}

// Custom validator for age groups
@ValidatorConstraint({ async: false })
export class IsAgeGroupConstraint implements ValidatorConstraintInterface {
  private validAgeGroups = [
    'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U18', 'U20',
    'Junior', 'Senior', 'Adult', 'Masters', '35+', '40+', '45+', '50+'
  ];

  validate(value: any, _args: ValidationArguments) {
    if (!value) return true; // Optional field
    return typeof value === 'string' && this.validAgeGroups.includes(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid age group`;
  }
}

export function IsAgeGroup(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAgeGroupConstraint,
    });
  };
}

// Custom validator for subdomain format
@ValidatorConstraint({ async: false })
export class IsSubdomainConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value) return false;
    // Subdomain rules: lowercase, alphanumeric, hyphens allowed but not at start/end
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return typeof value === 'string' && subdomainRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid subdomain (lowercase letters, numbers, and hyphens)`;
  }
}

export function IsSubdomain(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSubdomainConstraint,
    });
  };
}

// Custom validator for color hex codes
@ValidatorConstraint({ async: false })
export class IsHexColorConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value) return true; // Optional field
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return typeof value === 'string' && hexColorRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid hex color code`;
  }
}

export function IsHexColor(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsHexColorConstraint,
    });
  };
}

// Custom validator for date of birth (must be in the past and reasonable)
@ValidatorConstraint({ async: false })
export class IsValidDateOfBirthConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value) return true; // Optional field
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    const minAge = 5; // Minimum age for players
    const maxAge = 100; // Maximum reasonable age
    
    const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
    const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
    
    return date >= minDate && date <= maxDate;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid date of birth (between 5 and 100 years ago)`;
  }
}

export function IsValidDateOfBirth(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDateOfBirthConstraint,
    });
  };
}

// Custom validator for strong passwords
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (!value || typeof value !== 'string') return false;
    
    // At least 8 characters
    if (value.length < 8) return false;
    
    // Contains at least one uppercase letter
    if (!/[A-Z]/.test(value)) return false;
    
    // Contains at least one lowercase letter
    if (!/[a-z]/.test(value)) return false;
    
    // Contains at least one number
    if (!/[0-9]/.test(value)) return false;
    
    // Contains at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be at least 8 characters long and contain uppercase, lowercase, number, and special character`;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Async validator for unique email (requires database check)
@ValidatorConstraint({ async: true })
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  async validate(_email: any, _args: ValidationArguments) {
    // This would need to be injected with a user repository
    // For now, return true - actual implementation would check database
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return `Email already exists`;
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}