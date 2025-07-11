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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTemplateFilterDto = exports.BulkAssignTemplateDto = exports.DuplicateTemplateDto = exports.UpdateSessionTemplateDto = exports.CreateSessionTemplateDto = exports.PermissionsDto = exports.TargetGroupsDto = exports.WarmupCooldownDto = exports.ExerciseInTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const SessionTemplate_1 = require("../entities/SessionTemplate");
class ExerciseInTemplateDto {
}
exports.ExerciseInTemplateDto = ExerciseInTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExerciseInTemplateDto.prototype, "exerciseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExerciseInTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExerciseInTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "sets", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "reps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "distance", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "restBetweenSets", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ExerciseInTemplateDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExerciseInTemplateDto.prototype, "instructions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ExerciseInTemplateDto.prototype, "targetMetrics", void 0);
class WarmupCooldownDto {
}
exports.WarmupCooldownDto = WarmupCooldownDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WarmupCooldownDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], WarmupCooldownDto.prototype, "activities", void 0);
class TargetGroupsDto {
}
exports.TargetGroupsDto = TargetGroupsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TargetGroupsDto.prototype, "positions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TargetGroupsDto.prototype, "ageGroups", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TargetGroupsDto.prototype, "skillLevels", void 0);
class PermissionsDto {
}
exports.PermissionsDto = PermissionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PermissionsDto.prototype, "canEdit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PermissionsDto.prototype, "canView", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PermissionsDto.prototype, "canUse", void 0);
class CreateSessionTemplateDto {
}
exports.CreateSessionTemplateDto = CreateSessionTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateCategory),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SessionTemplate_1.WorkoutType),
    __metadata("design:type", typeof (_a = typeof SessionTemplate_1.WorkoutType !== "undefined" && SessionTemplate_1.WorkoutType) === "function" ? _a : Object)
], CreateSessionTemplateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SessionTemplate_1.DifficultyLevel),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateVisibility),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSessionTemplateDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSessionTemplateDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExerciseInTemplateDto),
    __metadata("design:type", Array)
], CreateSessionTemplateDto.prototype, "exercises", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WarmupCooldownDto),
    __metadata("design:type", WarmupCooldownDto)
], CreateSessionTemplateDto.prototype, "warmup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WarmupCooldownDto),
    __metadata("design:type", WarmupCooldownDto)
], CreateSessionTemplateDto.prototype, "cooldown", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSessionTemplateDto.prototype, "equipment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TargetGroupsDto),
    __metadata("design:type", TargetGroupsDto)
], CreateSessionTemplateDto.prototype, "targetGroups", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSessionTemplateDto.prototype, "goals", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSessionTemplateDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PermissionsDto),
    __metadata("design:type", PermissionsDto)
], CreateSessionTemplateDto.prototype, "permissions", void 0);
class UpdateSessionTemplateDto {
}
exports.UpdateSessionTemplateDto = UpdateSessionTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateSessionTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSessionTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateCategory),
    __metadata("design:type", String)
], UpdateSessionTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.WorkoutType),
    __metadata("design:type", typeof (_b = typeof SessionTemplate_1.WorkoutType !== "undefined" && SessionTemplate_1.WorkoutType) === "function" ? _b : Object)
], UpdateSessionTemplateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.DifficultyLevel),
    __metadata("design:type", String)
], UpdateSessionTemplateDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateVisibility),
    __metadata("design:type", String)
], UpdateSessionTemplateDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateSessionTemplateDto.prototype, "estimatedDuration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExerciseInTemplateDto),
    __metadata("design:type", Array)
], UpdateSessionTemplateDto.prototype, "exercises", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WarmupCooldownDto),
    __metadata("design:type", WarmupCooldownDto)
], UpdateSessionTemplateDto.prototype, "warmup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WarmupCooldownDto),
    __metadata("design:type", WarmupCooldownDto)
], UpdateSessionTemplateDto.prototype, "cooldown", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateSessionTemplateDto.prototype, "equipment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TargetGroupsDto),
    __metadata("design:type", TargetGroupsDto)
], UpdateSessionTemplateDto.prototype, "targetGroups", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateSessionTemplateDto.prototype, "goals", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateSessionTemplateDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PermissionsDto),
    __metadata("design:type", PermissionsDto)
], UpdateSessionTemplateDto.prototype, "permissions", void 0);
class DuplicateTemplateDto {
}
exports.DuplicateTemplateDto = DuplicateTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DuplicateTemplateDto.prototype, "name", void 0);
class BulkAssignTemplateDto {
}
exports.BulkAssignTemplateDto = BulkAssignTemplateDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkAssignTemplateDto.prototype, "playerIds", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkAssignTemplateDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkAssignTemplateDto.prototype, "scheduledDates", void 0);
class SessionTemplateFilterDto {
}
exports.SessionTemplateFilterDto = SessionTemplateFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateCategory),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.WorkoutType),
    __metadata("design:type", typeof (_c = typeof SessionTemplate_1.WorkoutType !== "undefined" && SessionTemplate_1.WorkoutType) === "function" ? _c : Object)
], SessionTemplateFilterDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.DifficultyLevel),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SessionTemplate_1.TemplateVisibility),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionTemplateFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SessionTemplateFilterDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SessionTemplateFilterDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SessionTemplateFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SessionTemplateFilterDto.prototype, "limit", void 0);
//# sourceMappingURL=sessionTemplate.dto.js.map