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
exports.TrainingStatistics = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let TrainingStatistics = class TrainingStatistics extends shared_lib_1.AuditableEntity {
    constructor() {
        super(...arguments);
        // Session Analytics
        this.completionRate = 0;
        // Compliance & Attendance
        this.attended = true;
        // Metadata
        this.status = 'completed';
    }
};
exports.TrainingStatistics = TrainingStatistics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], TrainingStatistics.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "trainingType", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "completionRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "averageIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "totalWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "exercisesCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "exercisesTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "strengthLoad", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "cardioLoad", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "skillsLoad", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "recoveryLoad", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "averageHeartRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "maxHeartRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "caloriesBurned", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "rpe", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], TrainingStatistics.prototype, "goalsAchieved", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "overallGoalAchievementRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "improvementFromLastSession", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "improvementFromBaseline", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "weeklyImprovementRate", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], TrainingStatistics.prototype, "exercisePerformance", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "programEffectivenessScore", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 100, nullable: true }),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "programName", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, nullable: true }),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "programPhase", void 0);
__decorate([
    (0, typeorm_1.Column)('boolean', { default: true }),
    __metadata("design:type", Boolean)
], TrainingStatistics.prototype, "attended", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "attendanceRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "complianceScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "injuryRiskScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "recoveryScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingStatistics.prototype, "fatigueLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'completed' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TrainingStatistics.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], TrainingStatistics.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TrainingStatistics.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TrainingStatistics.prototype, "updatedAt", void 0);
exports.TrainingStatistics = TrainingStatistics = __decorate([
    (0, typeorm_1.Entity)('training_statistics'),
    (0, typeorm_1.Index)(['playerId', 'sessionId', 'date']),
    (0, typeorm_1.Index)(['teamId', 'trainingType', 'date']),
    (0, typeorm_1.Index)(['organizationId', 'date'])
], TrainingStatistics);
//# sourceMappingURL=TrainingStatistics.js.map