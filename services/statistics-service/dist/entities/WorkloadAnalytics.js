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
exports.WorkloadAnalytics = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let WorkloadAnalytics = class WorkloadAnalytics extends shared_lib_1.AuditableEntity {
    constructor() {
        super(...arguments);
        this.periodType = 'week'; // week, month, season
        // Load Metrics
        this.totalWorkload = 0;
        this.acuteWorkload = 0; // 7-day rolling average
        this.chronicWorkload = 0; // 28-day rolling average
        // Load Distribution
        this.strengthWorkload = 0;
        this.cardioWorkload = 0;
        this.skillsWorkload = 0;
        this.gameWorkload = 0;
        this.recoveryWorkload = 0;
        // Volume Metrics
        this.totalSessions = 0;
        this.strengthSessions = 0;
        this.cardioSessions = 0;
        this.skillsSessions = 0;
        this.gameSessions = 0;
        this.recoverySessions = 0;
        this.totalTrainingTime = 0; // minutes
        this.missedSessions = 0;
        // Metadata
        this.status = 'active';
    }
};
exports.WorkloadAnalytics = WorkloadAnalytics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], WorkloadAnalytics.prototype, "weekStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 20, default: 'week' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "periodType", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "totalWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "acuteWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "chronicWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "acuteChronicRatio", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "strengthWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "cardioWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "skillsWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "gameWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "recoveryWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "averageIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "peakIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "timeInHighIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "timeInLowIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "totalSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "strengthSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "cardioSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "skillsSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "gameSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "recoverySessions", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "totalTrainingTime", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "injuryRiskScore", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 20, nullable: true }),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "riskLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "fatigueIndex", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "monotonieIndex", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "strainIndex", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "recoveryScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "readinessScore", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "restDays", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "sleepQualityAvg", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "hrvAvg", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "performanceTrend", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "fitnessLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "adaptationRate", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], WorkloadAnalytics.prototype, "recommendations", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, nullable: true }),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "recommendedAction", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "teamPercentileRank", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "positionPercentileRank", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "ageGroupPercentileRank", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "planCompliance", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "attendanceRate", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], WorkloadAnalytics.prototype, "missedSessions", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], WorkloadAnalytics.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], WorkloadAnalytics.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkloadAnalytics.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkloadAnalytics.prototype, "updatedAt", void 0);
exports.WorkloadAnalytics = WorkloadAnalytics = __decorate([
    (0, typeorm_1.Entity)('workload_analytics'),
    (0, typeorm_1.Index)(['playerId', 'weekStartDate']),
    (0, typeorm_1.Index)(['teamId', 'weekStartDate']),
    (0, typeorm_1.Index)(['organizationId', 'periodType', 'weekStartDate'])
], WorkloadAnalytics);
//# sourceMappingURL=WorkloadAnalytics.js.map