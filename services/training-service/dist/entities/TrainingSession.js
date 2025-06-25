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
exports.TrainingSession = void 0;
const typeorm_1 = require("typeorm");
const TrainingPlan_1 = require("./TrainingPlan");
const TrainingSessionPhase_1 = require("./TrainingSessionPhase");
const types_1 = require("@hockey-hub/types");
let TrainingSession = class TrainingSession {
};
exports.TrainingSession = TrainingSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TrainingSession.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TrainingSession.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TrainingSession.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TrainingSession.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TrainingPlan_1.TrainingPlan, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'planId' }),
    __metadata("design:type", TrainingPlan_1.TrainingPlan)
], TrainingSession.prototype, "trainingPlan", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrainingSession.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TrainingSession.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSession.prototype, "sessionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TrainingSession.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.IntensityLevel,
        nullable: true
    }),
    __metadata("design:type", String)
], TrainingSession.prototype, "intensityLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TrainingSession.prototype, "focus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TrainingSession.prototype, "isTemplate", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TrainingSessionPhase_1.TrainingSessionPhase, phase => phase.trainingSession, { cascade: true, eager: false }),
    __metadata("design:type", Array)
], TrainingSession.prototype, "phases", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], TrainingSession.prototype, "updatedAt", void 0);
exports.TrainingSession = TrainingSession = __decorate([
    (0, typeorm_1.Entity)('training_sessions'),
    (0, typeorm_1.Index)(['organizationId', 'sessionDate']),
    (0, typeorm_1.Index)(['planId']),
    (0, typeorm_1.Index)(['eventId'])
], TrainingSession);
