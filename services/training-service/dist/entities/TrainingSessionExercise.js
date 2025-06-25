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
exports.TrainingSessionExercise = void 0;
const typeorm_1 = require("typeorm");
const TrainingSessionPhase_1 = require("./TrainingSessionPhase");
const Exercise_1 = require("./Exercise");
const types_1 = require("@hockey-hub/types");
let TrainingSessionExercise = class TrainingSessionExercise {
};
exports.TrainingSessionExercise = TrainingSessionExercise;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "phaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TrainingSessionPhase_1.TrainingSessionPhase, phase => phase.exercises, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'phaseId' }),
    __metadata("design:type", TrainingSessionPhase_1.TrainingSessionPhase)
], TrainingSessionExercise.prototype, "trainingSessionPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "exerciseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Exercise_1.Exercise, { onDelete: 'RESTRICT' }) // Prevent deleting Exercise if used
    ,
    (0, typeorm_1.JoinColumn)({ name: 'exerciseId' }),
    __metadata("design:type", Exercise_1.Exercise)
], TrainingSessionExercise.prototype, "exercise", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "sets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "reps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "restTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingSessionExercise.prototype, "distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "intensity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.MeasurementUnit,
    }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSessionExercise.prototype, "updatedAt", void 0);
exports.TrainingSessionExercise = TrainingSessionExercise = __decorate([
    (0, typeorm_1.Entity)('training_session_exercises'),
    (0, typeorm_1.Index)(['phaseId', 'order']),
    (0, typeorm_1.Index)(['exerciseId'])
], TrainingSessionExercise);
