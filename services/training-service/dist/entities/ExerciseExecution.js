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
exports.ExerciseExecution = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutExecution_1 = require("./WorkoutExecution");
let ExerciseExecution = class ExerciseExecution extends shared_lib_1.BaseEntity {
};
exports.ExerciseExecution = ExerciseExecution;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExerciseExecution.prototype, "exerciseId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExerciseExecution.prototype, "exerciseName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "setNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "actualReps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "actualWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "actualDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "actualDistance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "actualPower", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ExerciseExecution.prototype, "restTaken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ExerciseExecution.prototype, "performanceMetrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ExerciseExecution.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ExerciseExecution.prototype, "skipped", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutExecution_1.WorkoutExecution, execution => execution.exerciseExecutions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workoutExecutionId' }),
    __metadata("design:type", WorkoutExecution_1.WorkoutExecution)
], ExerciseExecution.prototype, "workoutExecution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ExerciseExecution.prototype, "workoutExecutionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ExerciseExecution.prototype, "completedAt", void 0);
exports.ExerciseExecution = ExerciseExecution = __decorate([
    (0, typeorm_1.Entity)('exercise_executions')
], ExerciseExecution);
//# sourceMappingURL=ExerciseExecution.js.map