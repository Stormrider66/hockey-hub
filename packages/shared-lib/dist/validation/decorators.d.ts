import { ValidationOptions, ValidationArguments, ValidatorConstraintInterface } from 'class-validator';
export declare class IsUUIDConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsUUID(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsPhoneNumber(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsJerseyNumberConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsJerseyNumber(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsAgeGroupConstraint implements ValidatorConstraintInterface {
    private validAgeGroups;
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsAgeGroup(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsSubdomainConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsSubdomain(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsHexColorConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsHexColor(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsValidDateOfBirthConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsValidDateOfBirth(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsStrongPassword(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
    validate(_email: any, _args: ValidationArguments): Promise<boolean>;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function IsUniqueEmail(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
//# sourceMappingURL=decorators.d.ts.map