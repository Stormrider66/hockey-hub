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
exports.OrganizationSettingsValidation = exports.UpdateSubscriptionValidation = exports.UpdateOrganizationValidation = exports.CreateOrganizationValidation = exports.SubscriptionTier = void 0;
const class_validator_1 = require("class-validator");
const decorators_1 = require("../decorators");
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "free";
    SubscriptionTier["BASIC"] = "basic";
    SubscriptionTier["PREMIUM"] = "premium";
    SubscriptionTier["ENTERPRISE"] = "enterprise";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
class CreateOrganizationValidation {
}
exports.CreateOrganizationValidation = CreateOrganizationValidation;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Organization name is required' }),
    (0, class_validator_1.Length)(3, 255, { message: 'Organization name must be between 3 and 255 characters' }),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Subdomain is required' }),
    (0, class_validator_1.Length)(3, 100, { message: 'Subdomain must be between 3 and 100 characters' }),
    (0, decorators_1.IsSubdomain)({ message: 'Invalid subdomain format' }),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "subdomain", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Invalid logo URL' }),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsHexColor)({ message: 'Primary color must be a valid hex color' }),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "primaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsHexColor)({ message: 'Secondary color must be a valid hex color' }),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "secondaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SubscriptionTier, { message: 'Invalid subscription tier' }),
    __metadata("design:type", String)
], CreateOrganizationValidation.prototype, "subscriptionTier", void 0);
class UpdateOrganizationValidation {
}
exports.UpdateOrganizationValidation = UpdateOrganizationValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 255),
    __metadata("design:type", String)
], UpdateOrganizationValidation.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateOrganizationValidation.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateOrganizationValidation.prototype, "primaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsHexColor)(),
    __metadata("design:type", String)
], UpdateOrganizationValidation.prototype, "secondaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrganizationValidation.prototype, "isActive", void 0);
class UpdateSubscriptionValidation {
}
exports.UpdateSubscriptionValidation = UpdateSubscriptionValidation;
__decorate([
    (0, class_validator_1.IsEnum)(SubscriptionTier),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateSubscriptionValidation.prototype, "tier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSubscriptionValidation.prototype, "expiresAt", void 0);
class OrganizationSettingsValidation {
}
exports.OrganizationSettingsValidation = OrganizationSettingsValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrganizationSettingsValidation.prototype, "allowPlayerRegistration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrganizationSettingsValidation.prototype, "requireParentApproval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrganizationSettingsValidation.prototype, "enablePayments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrganizationSettingsValidation.prototype, "enableMedicalTracking", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrganizationSettingsValidation.prototype, "enableTrainingPlans", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 10),
    __metadata("design:type", String)
], OrganizationSettingsValidation.prototype, "defaultLanguage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 10),
    __metadata("design:type", String)
], OrganizationSettingsValidation.prototype, "defaultCurrency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrganizationSettingsValidation.prototype, "timezone", void 0);
