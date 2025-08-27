"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsUniqueEmail = exports.IsUniqueEmailConstraint = exports.IsStrongPassword = exports.IsStrongPasswordConstraint = exports.IsValidDateOfBirth = exports.IsValidDateOfBirthConstraint = exports.IsHexColor = exports.IsHexColorConstraint = exports.IsSubdomain = exports.IsSubdomainConstraint = exports.IsAgeGroup = exports.IsAgeGroupConstraint = exports.IsJerseyNumber = exports.IsJerseyNumberConstraint = exports.IsPhoneNumber = exports.IsPhoneNumberConstraint = exports.IsUUID = exports.IsUUIDConstraint = void 0;
const class_validator_1 = require("class-validator");
// Custom validator for UUID format
let IsUUIDConstraint = class IsUUIDConstraint {
    validate(value, _args) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && uuidRegex.test(value);
    }
    defaultMessage(args) {
        return `${args.property} must be a valid UUID`;
    }
};
exports.IsUUIDConstraint = IsUUIDConstraint;
exports.IsUUIDConstraint = IsUUIDConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsUUIDConstraint);
function IsUUID(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUUIDConstraint,
        });
    };
}
exports.IsUUID = IsUUID;
// Custom validator for phone numbers
let IsPhoneNumberConstraint = class IsPhoneNumberConstraint {
    validate(value, _args) {
        if (!value)
            return true; // Optional field
        // Support various phone formats
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
        return typeof value === 'string' && phoneRegex.test(value);
    }
    defaultMessage(args) {
        return `${args.property} must be a valid phone number`;
    }
};
exports.IsPhoneNumberConstraint = IsPhoneNumberConstraint;
exports.IsPhoneNumberConstraint = IsPhoneNumberConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsPhoneNumberConstraint);
function IsPhoneNumber(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPhoneNumberConstraint,
        });
    };
}
exports.IsPhoneNumber = IsPhoneNumber;
// Custom validator for jersey numbers
let IsJerseyNumberConstraint = class IsJerseyNumberConstraint {
    validate(value, _args) {
        if (!value)
            return true; // Optional field
        return typeof value === 'number' && value >= 1 && value <= 99;
    }
    defaultMessage(args) {
        return `${args.property} must be between 1 and 99`;
    }
};
exports.IsJerseyNumberConstraint = IsJerseyNumberConstraint;
exports.IsJerseyNumberConstraint = IsJerseyNumberConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsJerseyNumberConstraint);
function IsJerseyNumber(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsJerseyNumberConstraint,
        });
    };
}
exports.IsJerseyNumber = IsJerseyNumber;
// Custom validator for age groups
let IsAgeGroupConstraint = class IsAgeGroupConstraint {
    constructor() {
        this.validAgeGroups = [
            'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U18', 'U20',
            'Junior', 'Senior', 'Adult', 'Masters', '35+', '40+', '45+', '50+'
        ];
    }
    validate(value, _args) {
        if (!value)
            return true; // Optional field
        return typeof value === 'string' && this.validAgeGroups.includes(value);
    }
    defaultMessage(args) {
        return `${args.property} must be a valid age group`;
    }
};
exports.IsAgeGroupConstraint = IsAgeGroupConstraint;
exports.IsAgeGroupConstraint = IsAgeGroupConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsAgeGroupConstraint);
function IsAgeGroup(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsAgeGroupConstraint,
        });
    };
}
exports.IsAgeGroup = IsAgeGroup;
// Custom validator for subdomain format
let IsSubdomainConstraint = class IsSubdomainConstraint {
    validate(value, _args) {
        if (!value)
            return false;
        // Subdomain rules: lowercase, alphanumeric, hyphens allowed but not at start/end
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
        return typeof value === 'string' && subdomainRegex.test(value);
    }
    defaultMessage(args) {
        return `${args.property} must be a valid subdomain (lowercase letters, numbers, and hyphens)`;
    }
};
exports.IsSubdomainConstraint = IsSubdomainConstraint;
exports.IsSubdomainConstraint = IsSubdomainConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsSubdomainConstraint);
function IsSubdomain(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsSubdomainConstraint,
        });
    };
}
exports.IsSubdomain = IsSubdomain;
// Custom validator for color hex codes
let IsHexColorConstraint = class IsHexColorConstraint {
    validate(value, _args) {
        if (!value)
            return true; // Optional field
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return typeof value === 'string' && hexColorRegex.test(value);
    }
    defaultMessage(args) {
        return `${args.property} must be a valid hex color code`;
    }
};
exports.IsHexColorConstraint = IsHexColorConstraint;
exports.IsHexColorConstraint = IsHexColorConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsHexColorConstraint);
function IsHexColor(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsHexColorConstraint,
        });
    };
}
exports.IsHexColor = IsHexColor;
// Custom validator for date of birth (must be in the past and reasonable)
let IsValidDateOfBirthConstraint = class IsValidDateOfBirthConstraint {
    validate(value, _args) {
        if (!value)
            return true; // Optional field
        const date = new Date(value);
        if (isNaN(date.getTime()))
            return false;
        const now = new Date();
        const minAge = 5; // Minimum age for players
        const maxAge = 100; // Maximum reasonable age
        const minDate = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
        const maxDate = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        return date >= minDate && date <= maxDate;
    }
    defaultMessage(args) {
        return `${args.property} must be a valid date of birth (between 5 and 100 years ago)`;
    }
};
exports.IsValidDateOfBirthConstraint = IsValidDateOfBirthConstraint;
exports.IsValidDateOfBirthConstraint = IsValidDateOfBirthConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsValidDateOfBirthConstraint);
function IsValidDateOfBirth(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidDateOfBirthConstraint,
        });
    };
}
exports.IsValidDateOfBirth = IsValidDateOfBirth;
// Custom validator for strong passwords
let IsStrongPasswordConstraint = class IsStrongPasswordConstraint {
    validate(value, _args) {
        if (!value || typeof value !== 'string')
            return false;
        // At least 8 characters
        if (value.length < 8)
            return false;
        // Contains at least one uppercase letter
        if (!/[A-Z]/.test(value))
            return false;
        // Contains at least one lowercase letter
        if (!/[a-z]/.test(value))
            return false;
        // Contains at least one number
        if (!/[0-9]/.test(value))
            return false;
        // Contains at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
            return false;
        return true;
    }
    defaultMessage(args) {
        return `${args.property} must be at least 8 characters long and contain uppercase, lowercase, number, and special character`;
    }
};
exports.IsStrongPasswordConstraint = IsStrongPasswordConstraint;
exports.IsStrongPasswordConstraint = IsStrongPasswordConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: false })
], IsStrongPasswordConstraint);
function IsStrongPassword(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsStrongPasswordConstraint,
        });
    };
}
exports.IsStrongPassword = IsStrongPassword;
// Async validator for unique email (requires database check)
let IsUniqueEmailConstraint = class IsUniqueEmailConstraint {
    async validate(_email, _args) {
        // This would need to be injected with a user repository
        // For now, return true - actual implementation would check database
        return true;
    }
    defaultMessage(_args) {
        return `Email already exists`;
    }
};
exports.IsUniqueEmailConstraint = IsUniqueEmailConstraint;
exports.IsUniqueEmailConstraint = IsUniqueEmailConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ async: true })
], IsUniqueEmailConstraint);
function IsUniqueEmail(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueEmailConstraint,
        });
    };
}
exports.IsUniqueEmail = IsUniqueEmail;
//# sourceMappingURL=decorators.js.map