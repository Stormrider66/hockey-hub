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
exports.IntervalProgramDto = exports.IntervalSetDto = exports.IntervalTargetMetricsDto = exports.TargetMetricDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TargetMetricDto {
}
exports.TargetMetricDto = TargetMetricDto;
__decorate([
    (0, class_validator_1.IsEnum)(['absolute', 'percentage', 'zone']),
    __metadata("design:type", String)
], TargetMetricDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TargetMetricDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['max', 'threshold', 'resting', 'ftp']),
    __metadata("design:type", String)
], TargetMetricDto.prototype, "reference", void 0);
class IntervalTargetMetricsDto {
}
exports.IntervalTargetMetricsDto = IntervalTargetMetricsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TargetMetricDto),
    __metadata("design:type", TargetMetricDto)
], IntervalTargetMetricsDto.prototype, "heartRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TargetMetricDto),
    __metadata("design:type", TargetMetricDto)
], IntervalTargetMetricsDto.prototype, "watts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TargetMetricDto),
    __metadata("design:type", TargetMetricDto)
], IntervalTargetMetricsDto.prototype, "pace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], IntervalTargetMetricsDto.prototype, "rpm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], IntervalTargetMetricsDto.prototype, "calories", void 0);
class IntervalSetDto {
}
exports.IntervalSetDto = IntervalSetDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IntervalSetDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['warmup', 'work', 'rest', 'active_recovery', 'cooldown']),
    __metadata("design:type", String)
], IntervalSetDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(7200) // 2 hours max per interval
    ,
    __metadata("design:type", Number)
], IntervalSetDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IntervalSetDto.prototype, "equipment", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => IntervalTargetMetricsDto),
    __metadata("design:type", IntervalTargetMetricsDto)
], IntervalSetDto.prototype, "targetMetrics", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IntervalSetDto.prototype, "notes", void 0);
class IntervalProgramDto {
}
exports.IntervalProgramDto = IntervalProgramDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IntervalProgramDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IntervalProgramDto.prototype, "equipment", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], IntervalProgramDto.prototype, "totalDuration", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], IntervalProgramDto.prototype, "estimatedCalories", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => IntervalSetDto),
    __metadata("design:type", Array)
], IntervalProgramDto.prototype, "intervals", void 0);
//# sourceMappingURL=interval-program.dto.js.map