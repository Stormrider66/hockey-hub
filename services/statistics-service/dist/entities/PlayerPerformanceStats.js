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
exports.PlayerPerformanceStats = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let PlayerPerformanceStats = class PlayerPerformanceStats extends shared_lib_1.AuditableEntity {
    constructor() {
        super(...arguments);
        // Game Statistics
        this.goals = 0;
        this.assists = 0;
        this.plusMinus = 0;
        this.iceTime = 0;
        this.shots = 0;
        this.hits = 0;
        this.blocks = 0;
        // Metadata
        this.status = 'active';
    }
};
exports.PlayerPerformanceStats = PlayerPerformanceStats;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "seasonId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], PlayerPerformanceStats.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "verticalJump", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "sprintTime", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "vo2Max", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "strengthBenchmark", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "agilityScore", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "sleepQuality", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "hrv", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "energyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "readinessScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "weeklyWorkload", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "trainingIntensity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "fatigueLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "assists", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "plusMinus", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "iceTime", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "shots", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "hits", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "blocks", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "faceoffPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "performanceTrend", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "percentileRanking", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PlayerPerformanceStats.prototype, "improvementRate", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], PlayerPerformanceStats.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], PlayerPerformanceStats.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlayerPerformanceStats.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PlayerPerformanceStats.prototype, "updatedAt", void 0);
exports.PlayerPerformanceStats = PlayerPerformanceStats = __decorate([
    (0, typeorm_1.Entity)('player_performance_stats'),
    (0, typeorm_1.Index)(['playerId', 'seasonId', 'date']),
    (0, typeorm_1.Index)(['teamId', 'date']),
    (0, typeorm_1.Index)(['organizationId', 'date'])
], PlayerPerformanceStats);
//# sourceMappingURL=PlayerPerformanceStats.js.map