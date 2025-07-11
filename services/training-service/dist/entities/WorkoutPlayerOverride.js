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
exports.WorkoutPlayerOverride = exports.OverrideStatus = exports.OverrideType = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutAssignment_1 = require("./WorkoutAssignment");
var OverrideType;
(function (OverrideType) {
    OverrideType["MEDICAL"] = "medical";
    OverrideType["PERFORMANCE"] = "performance";
    OverrideType["SCHEDULING"] = "scheduling";
    OverrideType["CUSTOM"] = "custom";
})(OverrideType || (exports.OverrideType = OverrideType = {}));
var OverrideStatus;
(function (OverrideStatus) {
    OverrideStatus["PENDING"] = "pending";
    OverrideStatus["APPROVED"] = "approved";
    OverrideStatus["REJECTED"] = "rejected";
    OverrideStatus["EXPIRED"] = "expired";
})(OverrideStatus || (exports.OverrideStatus = OverrideStatus = {}));
let WorkoutPlayerOverride = class WorkoutPlayerOverride extends shared_lib_1.BaseEntity {
};
exports.WorkoutPlayerOverride = WorkoutPlayerOverride;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_override_assignment'),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "workoutAssignmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutAssignment_1.WorkoutAssignment, assignment => assignment.playerOverrides, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workoutAssignmentId' }),
    __metadata("design:type", WorkoutAssignment_1.WorkoutAssignment)
], WorkoutPlayerOverride.prototype, "workoutAssignment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_override_player'),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OverrideType }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "overrideType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OverrideStatus, default: OverrideStatus.PENDING }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], WorkoutPlayerOverride.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], WorkoutPlayerOverride.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "modifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "medicalRecordId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "medicalRestrictions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WorkoutPlayerOverride.prototype, "requestedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutPlayerOverride.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkoutPlayerOverride.prototype, "approvalNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "performanceData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "progressionOverride", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], WorkoutPlayerOverride.prototype, "requiresReview", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], WorkoutPlayerOverride.prototype, "nextReviewDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: [] }),
    __metadata("design:type", Array)
], WorkoutPlayerOverride.prototype, "communicationLog", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutPlayerOverride.prototype, "eventBusMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkoutPlayerOverride.prototype, "version", void 0);
exports.WorkoutPlayerOverride = WorkoutPlayerOverride = __decorate([
    (0, typeorm_1.Entity)('workout_player_overrides'),
    (0, typeorm_1.Unique)(['workoutAssignmentId', 'playerId', 'effectiveDate']),
    (0, typeorm_1.Index)('idx_override_player_date', ['playerId', 'effectiveDate']),
    (0, typeorm_1.Index)('idx_override_type_status', ['overrideType', 'status']),
    (0, typeorm_1.Index)('idx_override_medical_ref', ['medicalRecordId'])
], WorkoutPlayerOverride);
//# sourceMappingURL=WorkoutPlayerOverride.js.map