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
exports.CreateMedicalOverrideDTO = exports.MedicalSyncEventDTO = exports.AlternativesResultDTO = exports.GetAlternativesDTO = exports.AlternativeExerciseDTO = exports.ReportMedicalConcernDTO = exports.ComplianceResultDTO = exports.ComplianceCheckDTO = exports.SyncMedicalRestrictionsDTO = exports.MedicalRestrictionDTO = exports.ComplianceStatus = exports.RestrictionStatus = exports.RestrictionSeverity = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var RestrictionSeverity;
(function (RestrictionSeverity) {
    RestrictionSeverity["MILD"] = "mild";
    RestrictionSeverity["MODERATE"] = "moderate";
    RestrictionSeverity["SEVERE"] = "severe";
    RestrictionSeverity["COMPLETE"] = "complete";
})(RestrictionSeverity || (exports.RestrictionSeverity = RestrictionSeverity = {}));
var RestrictionStatus;
(function (RestrictionStatus) {
    RestrictionStatus["ACTIVE"] = "active";
    RestrictionStatus["PENDING"] = "pending";
    RestrictionStatus["EXPIRED"] = "expired";
    RestrictionStatus["CLEARED"] = "cleared";
})(RestrictionStatus || (exports.RestrictionStatus = RestrictionStatus = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["PARTIAL"] = "partial";
    ComplianceStatus["NON_COMPLIANT"] = "non_compliant";
    ComplianceStatus["NOT_APPLICABLE"] = "not_applicable";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
class MedicalRestrictionDTO {
}
exports.MedicalRestrictionDTO = MedicalRestrictionDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RestrictionSeverity),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RestrictionStatus),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MedicalRestrictionDTO.prototype, "affectedBodyParts", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MedicalRestrictionDTO.prototype, "restrictedMovements", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MedicalRestrictionDTO.prototype, "restrictedExerciseTypes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MedicalRestrictionDTO.prototype, "maxExertionLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MedicalRestrictionDTO.prototype, "requiresSupervision", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MedicalRestrictionDTO.prototype, "clearanceRequired", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MedicalRestrictionDTO.prototype, "effectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], MedicalRestrictionDTO.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "medicalNotes", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MedicalRestrictionDTO.prototype, "prescribedBy", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], MedicalRestrictionDTO.prototype, "prescribedAt", void 0);
class SyncMedicalRestrictionsDTO {
}
exports.SyncMedicalRestrictionsDTO = SyncMedicalRestrictionsDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SyncMedicalRestrictionsDTO.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SyncMedicalRestrictionsDTO.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SyncMedicalRestrictionsDTO.prototype, "playerIds", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], SyncMedicalRestrictionsDTO.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SyncMedicalRestrictionsDTO.prototype, "includeExpired", void 0);
class ComplianceCheckDTO {
}
exports.ComplianceCheckDTO = ComplianceCheckDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ComplianceCheckDTO.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ComplianceCheckDTO.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ComplianceCheckDTO.prototype, "detailed", void 0);
class ComplianceResultDTO {
}
exports.ComplianceResultDTO = ComplianceResultDTO;
class ReportMedicalConcernDTO {
}
exports.ReportMedicalConcernDTO = ReportMedicalConcernDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "exerciseId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['injury', 'discomfort', 'fatigue', 'technique', 'other']),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "concernType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ReportMedicalConcernDTO.prototype, "affectedBodyParts", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ReportMedicalConcernDTO.prototype, "requiresImmediateAttention", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReportMedicalConcernDTO.prototype, "reportedBy", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ReportMedicalConcernDTO.prototype, "occurredAt", void 0);
class AlternativeExerciseDTO {
}
exports.AlternativeExerciseDTO = AlternativeExerciseDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AlternativeExerciseDTO.prototype, "originalExerciseId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AlternativeExerciseDTO.prototype, "alternativeExerciseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlternativeExerciseDTO.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], AlternativeExerciseDTO.prototype, "loadMultiplier", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    __metadata("design:type", Number)
], AlternativeExerciseDTO.prototype, "restMultiplier", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AlternativeExerciseDTO.prototype, "modifications", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AlternativeExerciseDTO.prototype, "requiresSupervision", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AlternativeExerciseDTO.prototype, "suitabilityScore", void 0);
class GetAlternativesDTO {
}
exports.GetAlternativesDTO = GetAlternativesDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetAlternativesDTO.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GetAlternativesDTO.prototype, "exerciseIds", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetAlternativesDTO.prototype, "workoutId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GetAlternativesDTO.prototype, "includeRationale", void 0);
class AlternativesResultDTO {
}
exports.AlternativesResultDTO = AlternativesResultDTO;
class MedicalSyncEventDTO {
}
exports.MedicalSyncEventDTO = MedicalSyncEventDTO;
class CreateMedicalOverrideDTO {
}
exports.CreateMedicalOverrideDTO = CreateMedicalOverrideDTO;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMedicalOverrideDTO.prototype, "workoutAssignmentId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMedicalOverrideDTO.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMedicalOverrideDTO.prototype, "medicalRecordId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MedicalRestrictionDTO),
    __metadata("design:type", MedicalRestrictionDTO)
], CreateMedicalOverrideDTO.prototype, "restriction", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AlternativeExerciseDTO),
    __metadata("design:type", Array)
], CreateMedicalOverrideDTO.prototype, "alternatives", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMedicalOverrideDTO.prototype, "autoApprove", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicalOverrideDTO.prototype, "notes", void 0);
//# sourceMappingURL=medical-integration.dto.js.map