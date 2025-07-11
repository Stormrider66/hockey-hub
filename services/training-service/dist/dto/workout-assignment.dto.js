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
exports.WorkoutAssignmentFilterDto = exports.CreatePlayerOverrideDto = exports.ResolveConflictDto = exports.ConflictCheckDto = exports.CascadeAssignmentDto = exports.BulkAssignWorkoutDto = exports.RecurrencePatternDto = exports.AssignmentTargetDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const WorkoutAssignment_1 = require("../entities/WorkoutAssignment");
const WorkoutPlayerOverride_1 = require("../entities/WorkoutPlayerOverride");
const WorkoutType_1 = require("../entities/WorkoutType");
// Base assignment target DTO
class AssignmentTargetDto {
}
exports.AssignmentTargetDto = AssignmentTargetDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignmentTargetDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignmentTargetDto.prototype, "lineId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignmentTargetDto.prototype, "positionCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignmentTargetDto.prototype, "ageGroupId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignmentTargetDto.prototype, "customGroupId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], AssignmentTargetDto.prototype, "playerIds", void 0);
// Recurrence pattern DTO
class RecurrencePatternDto {
}
exports.RecurrencePatternDto = RecurrencePatternDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecurrencePatternDto.prototype, "interval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], RecurrencePatternDto.prototype, "daysOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], RecurrencePatternDto.prototype, "dayOfMonth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], RecurrencePatternDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RecurrencePatternDto.prototype, "occurrences", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ each: true }),
    __metadata("design:type", Array)
], RecurrencePatternDto.prototype, "exceptions", void 0);
// Bulk assignment DTO
class BulkAssignWorkoutDto {
}
exports.BulkAssignWorkoutDto = BulkAssignWorkoutDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkAssignWorkoutDto.prototype, "workoutSessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkAssignWorkoutDto.prototype, "sessionTemplateId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(WorkoutAssignment_1.AssignmentType),
    __metadata("design:type", String)
], BulkAssignWorkoutDto.prototype, "assignmentType", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => AssignmentTargetDto),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", AssignmentTargetDto)
], BulkAssignWorkoutDto.prototype, "assignmentTarget", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], BulkAssignWorkoutDto.prototype, "effectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], BulkAssignWorkoutDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], BulkAssignWorkoutDto.prototype, "scheduledDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WorkoutType_1.WorkoutType),
    __metadata("design:type", String)
], BulkAssignWorkoutDto.prototype, "workoutType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WorkoutAssignment_1.RecurrenceType),
    __metadata("design:type", String)
], BulkAssignWorkoutDto.prototype, "recurrenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => RecurrencePatternDto),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", RecurrencePatternDto)
], BulkAssignWorkoutDto.prototype, "recurrencePattern", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], BulkAssignWorkoutDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkAssignWorkoutDto.prototype, "allowPlayerOverrides", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkAssignWorkoutDto.prototype, "requireMedicalClearance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkAssignWorkoutDto.prototype, "notifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkAssignWorkoutDto.prototype, "loadProgression", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkAssignWorkoutDto.prototype, "performanceThresholds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkAssignWorkoutDto.prototype, "metadata", void 0);
// Cascade assignment DTO
class CascadeAssignmentDto extends BulkAssignWorkoutDto {
}
exports.CascadeAssignmentDto = CascadeAssignmentDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CascadeAssignmentDto.prototype, "cascadeToSubTeams", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CascadeAssignmentDto.prototype, "cascadeToPlayers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CascadeAssignmentDto.prototype, "excludeTeamIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CascadeAssignmentDto.prototype, "excludePlayerIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CascadeAssignmentDto.prototype, "respectExistingAssignments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['skip', 'replace', 'merge']),
    __metadata("design:type", String)
], CascadeAssignmentDto.prototype, "conflictResolution", void 0);
// Conflict check DTO
class ConflictCheckDto {
}
exports.ConflictCheckDto = ConflictCheckDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ConflictCheckDto.prototype, "playerIds", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], ConflictCheckDto.prototype, "startDate", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], ConflictCheckDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(WorkoutType_1.WorkoutType, { each: true }),
    __metadata("design:type", Array)
], ConflictCheckDto.prototype, "workoutTypes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConflictCheckDto.prototype, "checkMedicalRestrictions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConflictCheckDto.prototype, "checkLoadLimits", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConflictCheckDto.prototype, "maxDailyLoad", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConflictCheckDto.prototype, "maxWeeklyLoad", void 0);
// Conflict resolution DTO
class ResolveConflictDto {
}
exports.ResolveConflictDto = ResolveConflictDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResolveConflictDto.prototype, "conflictId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['cancel', 'reschedule', 'merge', 'override']),
    __metadata("design:type", String)
], ResolveConflictDto.prototype, "resolution", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], ResolveConflictDto.prototype, "newScheduledDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ResolveConflictDto.prototype, "mergeOptions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveConflictDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ResolveConflictDto.prototype, "affectedPlayerIds", void 0);
// Player override DTO
class CreatePlayerOverrideDto {
}
exports.CreatePlayerOverrideDto = CreatePlayerOverrideDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePlayerOverrideDto.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(WorkoutPlayerOverride_1.OverrideType),
    __metadata("design:type", String)
], CreatePlayerOverrideDto.prototype, "overrideType", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreatePlayerOverrideDto.prototype, "effectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreatePlayerOverrideDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePlayerOverrideDto.prototype, "modifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePlayerOverrideDto.prototype, "medicalRecordId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePlayerOverrideDto.prototype, "medicalRestrictions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlayerOverrideDto.prototype, "approvalNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePlayerOverrideDto.prototype, "performanceData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePlayerOverrideDto.prototype, "progressionOverride", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePlayerOverrideDto.prototype, "metadata", void 0);
// Assignment filter DTO
class WorkoutAssignmentFilterDto {
}
exports.WorkoutAssignmentFilterDto = WorkoutAssignmentFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WorkoutAssignmentFilterDto.prototype, "playerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WorkoutAssignmentFilterDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WorkoutAssignment_1.AssignmentStatus),
    __metadata("design:type", String)
], WorkoutAssignmentFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WorkoutAssignment_1.AssignmentType),
    __metadata("design:type", String)
], WorkoutAssignmentFilterDto.prototype, "assignmentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], WorkoutAssignmentFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], WorkoutAssignmentFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], WorkoutAssignmentFilterDto.prototype, "includeExpired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], WorkoutAssignmentFilterDto.prototype, "includeOverrides", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WorkoutAssignmentFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], WorkoutAssignmentFilterDto.prototype, "limit", void 0);
//# sourceMappingURL=workout-assignment.dto.js.map