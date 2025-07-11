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
exports.WorkoutSession = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const Exercise_1 = require("./Exercise");
const PlayerWorkoutLoad_1 = require("./PlayerWorkoutLoad");
const WorkoutExecution_1 = require("./WorkoutExecution");
const WorkoutType_1 = require("./WorkoutType");
let WorkoutSession = class WorkoutSession extends shared_lib_1.BaseEntity {
};
exports.WorkoutSession = WorkoutSession;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkoutSession.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: WorkoutType_1.WorkoutType }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'scheduled' }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WorkoutSession.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkoutSession.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], WorkoutSession.prototype, "playerIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "estimatedDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkoutSession.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Exercise_1.Exercise, exercise => exercise.workoutSession, { cascade: true }),
    __metadata("design:type", Array)
], WorkoutSession.prototype, "exercises", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PlayerWorkoutLoad_1.PlayerWorkoutLoad, load => load.workoutSession, { cascade: true }),
    __metadata("design:type", Array)
], WorkoutSession.prototype, "playerLoads", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WorkoutExecution_1.WorkoutExecution, execution => execution.workoutSession),
    __metadata("design:type", Array)
], WorkoutSession.prototype, "executions", void 0);
exports.WorkoutSession = WorkoutSession = __decorate([
    (0, typeorm_1.Entity)('workout_sessions')
], WorkoutSession);
//# sourceMappingURL=WorkoutSession.js.map