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
exports.WorkoutAssignment = exports.RecurrenceType = exports.AssignmentStatus = exports.AssignmentType = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutSession_1 = require("./WorkoutSession");
const WorkoutPlayerOverride_1 = require("./WorkoutPlayerOverride");
const WorkoutType_1 = require("./WorkoutType");
var AssignmentType;
(function (AssignmentType) {
    AssignmentType["INDIVIDUAL"] = "individual";
    AssignmentType["TEAM"] = "team";
    AssignmentType["LINE"] = "line";
    AssignmentType["POSITION"] = "position";
    AssignmentType["AGE_GROUP"] = "age_group";
    AssignmentType["CUSTOM_GROUP"] = "custom_group";
})(AssignmentType || (exports.AssignmentType = AssignmentType = {}));
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["DRAFT"] = "draft";
    AssignmentStatus["ACTIVE"] = "active";
    AssignmentStatus["COMPLETED"] = "completed";
    AssignmentStatus["CANCELLED"] = "cancelled";
    AssignmentStatus["ARCHIVED"] = "archived";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
var RecurrenceType;
(function (RecurrenceType) {
    RecurrenceType["NONE"] = "none";
    RecurrenceType["DAILY"] = "daily";
    RecurrenceType["WEEKLY"] = "weekly";
    RecurrenceType["BIWEEKLY"] = "biweekly";
    RecurrenceType["MONTHLY"] = "monthly";
    RecurrenceType["CUSTOM"] = "custom";
})(RecurrenceType || (exports.RecurrenceType = RecurrenceType = {}));
let WorkoutAssignment = class WorkoutAssignment extends shared_lib_1.BaseEntity {
};
exports.WorkoutAssignment = WorkoutAssignment;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_assignment_workout'),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "workoutSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "sessionTemplateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutSession_1.WorkoutSession, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workoutSessionId' }),
    __metadata("design:type", WorkoutSession_1.WorkoutSession)
], WorkoutAssignment.prototype, "workoutSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AssignmentType }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "assignmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.DRAFT }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: WorkoutType_1.WorkoutType, nullable: true }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "workoutType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "assignmentTarget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], WorkoutAssignment.prototype, "exercisesCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], WorkoutAssignment.prototype, "exercisesTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RecurrenceType, default: RecurrenceType.NONE }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "recurrenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "recurrencePattern", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkoutAssignment.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "loadProgression", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "performanceThresholds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WorkoutAssignment.prototype, "allowPlayerOverrides", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], WorkoutAssignment.prototype, "requireMedicalClearance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "notifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_assignment_parent_hierarchy'),
    __metadata("design:type", String)
], WorkoutAssignment.prototype, "parentAssignmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutAssignment, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'parentAssignmentId' }),
    __metadata("design:type", WorkoutAssignment)
], WorkoutAssignment.prototype, "parentAssignment", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WorkoutAssignment, assignment => assignment.parentAssignment),
    __metadata("design:type", Array)
], WorkoutAssignment.prototype, "childAssignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WorkoutPlayerOverride_1.WorkoutPlayerOverride, override => override.workoutAssignment, { cascade: true }),
    __metadata("design:type", Array)
], WorkoutAssignment.prototype, "playerOverrides", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "eventMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutAssignment.prototype, "eventBusMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutAssignment.prototype, "lastSyncedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkoutAssignment.prototype, "version", void 0);
exports.WorkoutAssignment = WorkoutAssignment = __decorate([
    (0, typeorm_1.Entity)('workout_assignments'),
    (0, typeorm_1.Unique)(['workoutSessionId', 'organizationId', 'effectiveDate']),
    (0, typeorm_1.Index)('idx_assignment_organization_date', ['organizationId', 'effectiveDate']),
    (0, typeorm_1.Index)('idx_assignment_type_status', ['assignmentType', 'status']),
    (0, typeorm_1.Index)('idx_assignment_parent', ['parentAssignmentId']),
    (0, typeorm_1.Index)('idx_assignment_created_by', ['createdBy'])
], WorkoutAssignment);
//# sourceMappingURL=WorkoutAssignment.js.map