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
exports.TrainingSessionPhase = void 0;
const typeorm_1 = require("typeorm");
const TrainingSession_1 = require("./TrainingSession");
const TrainingSessionExercise_1 = require("./TrainingSessionExercise");
let TrainingSessionPhase = class TrainingSessionPhase {
};
exports.TrainingSessionPhase = TrainingSessionPhase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TrainingSession_1.TrainingSession, session => session.phases, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", TrainingSession_1.TrainingSession)
], TrainingSessionPhase.prototype, "trainingSession", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], TrainingSessionPhase.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TrainingSessionExercise_1.TrainingSessionExercise, exercise => exercise.trainingSessionPhase, { cascade: true, eager: false }),
    __metadata("design:type", Array)
], TrainingSessionPhase.prototype, "exercises", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSessionPhase.prototype, "updatedAt", void 0);
exports.TrainingSessionPhase = TrainingSessionPhase = __decorate([
    (0, typeorm_1.Entity)('training_session_phases'),
    (0, typeorm_1.Index)(['sessionId', 'order'])
], TrainingSessionPhase);
