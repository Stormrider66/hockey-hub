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
exports.ProgressionRecommendationDto = exports.MetricsValidationResponseDto = exports.ValidateMetricsDto = exports.WorkoutTypeStatisticsDto = exports.WorkoutTypeConfigResponseDto = exports.UpdateWorkoutTypeConfigDto = exports.CreateWorkoutTypeConfigDto = exports.SafetyProtocolDto = exports.ProgressionModelDto = exports.ProgressionLevelDto = exports.EquipmentRequirementDto = exports.CalculatedMetricDto = exports.MetricsConfigDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const WorkoutType_1 = require("../entities/WorkoutType");
class MetricsConfigDto {
}
exports.MetricsConfigDto = MetricsConfigDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MetricsConfigDto.prototype, "primary", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], MetricsConfigDto.prototype, "secondary", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CalculatedMetricDto),
    __metadata("design:type", Array)
], MetricsConfigDto.prototype, "calculated", void 0);
class CalculatedMetricDto {
}
exports.CalculatedMetricDto = CalculatedMetricDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatedMetricDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatedMetricDto.prototype, "formula", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatedMetricDto.prototype, "unit", void 0);
class EquipmentRequirementDto {
}
exports.EquipmentRequirementDto = EquipmentRequirementDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EquipmentRequirementDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EquipmentRequirementDto.prototype, "alternatives", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], EquipmentRequirementDto.prototype, "optional", void 0);
class ProgressionLevelDto {
}
exports.ProgressionLevelDto = ProgressionLevelDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProgressionLevelDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProgressionLevelDto.prototype, "focus", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProgressionLevelDto.prototype, "goals", void 0);
class ProgressionModelDto {
}
exports.ProgressionModelDto = ProgressionModelDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionLevelDto),
    __metadata("design:type", ProgressionLevelDto)
], ProgressionModelDto.prototype, "beginner", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionLevelDto),
    __metadata("design:type", ProgressionLevelDto)
], ProgressionModelDto.prototype, "intermediate", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionLevelDto),
    __metadata("design:type", ProgressionLevelDto)
], ProgressionModelDto.prototype, "advanced", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionLevelDto),
    __metadata("design:type", ProgressionLevelDto)
], ProgressionModelDto.prototype, "elite", void 0);
class SafetyProtocolDto {
}
exports.SafetyProtocolDto = SafetyProtocolDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SafetyProtocolDto.prototype, "warmupRequired", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafetyProtocolDto.prototype, "warmupDuration", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SafetyProtocolDto.prototype, "cooldownRequired", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafetyProtocolDto.prototype, "cooldownDuration", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyProtocolDto.prototype, "contraindications", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyProtocolDto.prototype, "injuryPrevention", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SafetyProtocolDto.prototype, "monitoringRequired", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SafetyProtocolDto.prototype, "maxIntensity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SafetyProtocolDto.prototype, "recoveryTime", void 0);
class CreateWorkoutTypeConfigDto {
}
exports.CreateWorkoutTypeConfigDto = CreateWorkoutTypeConfigDto;
__decorate([
    (0, class_validator_1.IsEnum)(WorkoutType_1.WorkoutType),
    __metadata("design:type", String)
], CreateWorkoutTypeConfigDto.prototype, "workoutType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkoutTypeConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWorkoutTypeConfigDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MetricsConfigDto),
    __metadata("design:type", MetricsConfigDto)
], CreateWorkoutTypeConfigDto.prototype, "metricsConfig", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EquipmentRequirementDto),
    __metadata("design:type", EquipmentRequirementDto)
], CreateWorkoutTypeConfigDto.prototype, "equipmentRequirements", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionModelDto),
    __metadata("design:type", ProgressionModelDto)
], CreateWorkoutTypeConfigDto.prototype, "progressionModels", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SafetyProtocolDto),
    __metadata("design:type", SafetyProtocolDto)
], CreateWorkoutTypeConfigDto.prototype, "safetyProtocols", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateWorkoutTypeConfigDto.prototype, "customSettings", void 0);
class UpdateWorkoutTypeConfigDto {
}
exports.UpdateWorkoutTypeConfigDto = UpdateWorkoutTypeConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWorkoutTypeConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateWorkoutTypeConfigDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MetricsConfigDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", MetricsConfigDto)
], UpdateWorkoutTypeConfigDto.prototype, "metricsConfig", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EquipmentRequirementDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", EquipmentRequirementDto)
], UpdateWorkoutTypeConfigDto.prototype, "equipmentRequirements", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProgressionModelDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ProgressionModelDto)
], UpdateWorkoutTypeConfigDto.prototype, "progressionModels", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SafetyProtocolDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SafetyProtocolDto)
], UpdateWorkoutTypeConfigDto.prototype, "safetyProtocols", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateWorkoutTypeConfigDto.prototype, "customSettings", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateWorkoutTypeConfigDto.prototype, "isActive", void 0);
class WorkoutTypeConfigResponseDto {
}
exports.WorkoutTypeConfigResponseDto = WorkoutTypeConfigResponseDto;
class WorkoutTypeStatisticsDto {
}
exports.WorkoutTypeStatisticsDto = WorkoutTypeStatisticsDto;
class ValidateMetricsDto {
}
exports.ValidateMetricsDto = ValidateMetricsDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ValidateMetricsDto.prototype, "metrics", void 0);
class MetricsValidationResponseDto {
}
exports.MetricsValidationResponseDto = MetricsValidationResponseDto;
class ProgressionRecommendationDto {
}
exports.ProgressionRecommendationDto = ProgressionRecommendationDto;
//# sourceMappingURL=workout-type.dto.js.map