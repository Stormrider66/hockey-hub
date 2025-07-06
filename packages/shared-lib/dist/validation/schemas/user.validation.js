"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentChildRelationshipValidation = exports.BulkUserOperationValidation = exports.AddUserToTeamValidation = exports.AddUserToOrganizationValidation = exports.GetUsersQueryValidation = exports.ChangePasswordValidation = exports.UpdateUserValidation = exports.CreateUserValidation = exports.UserRole = exports.Handedness = void 0;
const class_validator_1 = require("class-validator");
const decorators_1 = require("../decorators");
var Handedness;
(function (Handedness) {
    Handedness["LEFT"] = "left";
    Handedness["RIGHT"] = "right";
    Handedness["AMBIDEXTROUS"] = "ambidextrous";
})(Handedness || (exports.Handedness = Handedness = {}));
var UserRole;
(function (UserRole) {
    UserRole["PLAYER"] = "player";
    UserRole["COACH"] = "coach";
    UserRole["ASSISTANT_COACH"] = "assistant_coach";
    UserRole["TEAM_MANAGER"] = "team_manager";
    UserRole["PARENT"] = "parent";
    UserRole["MEDICAL_STAFF"] = "medical_staff";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
class CreateUserValidation {
}
exports.CreateUserValidation = CreateUserValidation;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    (0, decorators_1.IsUniqueEmail)({ message: 'Email already exists' }),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, decorators_1.IsStrongPassword)(),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'First name is required' }),
    (0, class_validator_1.Length)(2, 50, { message: 'First name must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Last name is required' }),
    (0, class_validator_1.Length)(2, 50, { message: 'Last name must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, decorators_1.IsValidDateOfBirth)(),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsJerseyNumber)(),
    __metadata("design:type", Number)
], CreateUserValidation.prototype, "jerseyNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Handedness, { message: 'Invalid handedness value' }),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "handedness", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500, { message: 'Profile image URL too long' }),
    __metadata("design:type", String)
], CreateUserValidation.prototype, "profileImageUrl", void 0);
class UpdateUserValidation {
}
exports.UpdateUserValidation = UpdateUserValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsPhoneNumber)(),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, decorators_1.IsValidDateOfBirth)(),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsJerseyNumber)(),
    __metadata("design:type", Number)
], UpdateUserValidation.prototype, "jerseyNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Handedness),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "handedness", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateUserValidation.prototype, "profileImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserValidation.prototype, "isActive", void 0);
class ChangePasswordValidation {
}
exports.ChangePasswordValidation = ChangePasswordValidation;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Current password is required' }),
    __metadata("design:type", String)
], ChangePasswordValidation.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password is required' }),
    (0, decorators_1.IsStrongPassword)(),
    __metadata("design:type", String)
], ChangePasswordValidation.prototype, "newPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password confirmation is required' }),
    __metadata("design:type", String)
], ChangePasswordValidation.prototype, "confirmPassword", void 0);
class GetUsersQueryValidation {
}
exports.GetUsersQueryValidation = GetUsersQueryValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsUUID)(),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsUUID)(),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(UserRole),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetUsersQueryValidation.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetUsersQueryValidation.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetUsersQueryValidation.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['firstName', 'lastName', 'email', 'createdAt']),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], GetUsersQueryValidation.prototype, "sortOrder", void 0);
class AddUserToOrganizationValidation {
}
exports.AddUserToOrganizationValidation = AddUserToOrganizationValidation;
__decorate([
    (0, decorators_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddUserToOrganizationValidation.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UserRole),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddUserToOrganizationValidation.prototype, "role", void 0);
class AddUserToTeamValidation {
}
exports.AddUserToTeamValidation = AddUserToTeamValidation;
__decorate([
    (0, decorators_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddUserToTeamValidation.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['player', 'coach', 'assistant_coach', 'team_manager', 'medical_staff']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddUserToTeamValidation.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsJerseyNumber)(),
    __metadata("design:type", Number)
], AddUserToTeamValidation.prototype, "jerseyNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], AddUserToTeamValidation.prototype, "position", void 0);
class BulkUserOperationValidation {
}
exports.BulkUserOperationValidation = BulkUserOperationValidation;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one user ID is required' }),
    (0, class_validator_1.ArrayMaxSize)(100, { message: 'Maximum 100 users per operation' }),
    (0, decorators_1.IsUUID)({ each: true }),
    __metadata("design:type", Array)
], BulkUserOperationValidation.prototype, "userIds", void 0);
class ParentChildRelationshipValidation {
}
exports.ParentChildRelationshipValidation = ParentChildRelationshipValidation;
__decorate([
    (0, decorators_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ParentChildRelationshipValidation.prototype, "parentUserId", void 0);
__decorate([
    (0, decorators_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ParentChildRelationshipValidation.prototype, "childUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    __metadata("design:type", String)
], ParentChildRelationshipValidation.prototype, "relationshipType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ParentChildRelationshipValidation.prototype, "isPrimaryContact", void 0);
//# sourceMappingURL=user.validation.js.map