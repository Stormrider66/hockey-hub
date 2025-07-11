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
exports.WorkoutExecution = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutSession_1 = require("./WorkoutSession");
const ExerciseExecution_1 = require("./ExerciseExecution");
let WorkoutExecution = class WorkoutExecution extends shared_lib_1.BaseEntity {
};
exports.WorkoutExecution = WorkoutExecution;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutExecution.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutSession_1.WorkoutSession, session => session.executions),
    (0, typeorm_1.JoinColumn)({ name: 'workoutSessionId' }),
    __metadata("design:type", WorkoutSession_1.WorkoutSession)
], WorkoutExecution.prototype, "workoutSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutExecution.prototype, "workoutSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'not_started' }),
    __metadata("design:type", String)
], WorkoutExecution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutExecution.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkoutExecution.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkoutExecution.prototype, "currentExerciseIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkoutExecution.prototype, "currentSetNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], WorkoutExecution.prototype, "completionPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutExecution.prototype, "metrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutExecution.prototype, "deviceData", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ExerciseExecution_1.ExerciseExecution, execution => execution.workoutExecution, { cascade: true }),
    __metadata("design:type", Array)
], WorkoutExecution.prototype, "exerciseExecutions", void 0);
exports.WorkoutExecution = WorkoutExecution = __decorate([
    (0, typeorm_1.Entity)('workout_executions')
], WorkoutExecution);
//# sourceMappingURL=WorkoutExecution.js.map