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
exports.TeamAnalytics = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let TeamAnalytics = class TeamAnalytics extends shared_lib_1.AuditableEntity {
    constructor() {
        super(...arguments);
        this.gameType = 'regular'; // regular, playoff, practice, scrimmage
        // Team Performance Stats
        this.wins = 0;
        this.losses = 0;
        this.ties = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
        this.shotsFor = 0;
        this.shotsAgainst = 0;
        // Special Teams
        this.powerPlayGoals = 0;
        this.powerPlayOpportunities = 0;
        this.shortHandedGoals = 0;
        this.penaltyKillOpportunities = 0;
        // Metadata
        this.status = 'active';
    }
};
exports.TeamAnalytics = TeamAnalytics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "seasonId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], TeamAnalytics.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'regular' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "gameType", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "wins", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "losses", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "ties", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "goalsFor", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "goalsAgainst", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "shotsFor", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "shotsAgainst", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "shotPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "savePercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "powerPlayGoals", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "powerPlayOpportunities", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "powerPlayPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "shortHandedGoals", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "penaltyKillOpportunities", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "penaltyKillPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "corsiFor", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "corsiAgainst", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "corsiPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "fenwickFor", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "fenwickAgainst", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "fenwickPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], TeamAnalytics.prototype, "linePerformance", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], TeamAnalytics.prototype, "situationStats", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "performanceTrend", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "momentumScore", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], TeamAnalytics.prototype, "leagueRanking", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TeamAnalytics.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], TeamAnalytics.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeamAnalytics.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeamAnalytics.prototype, "updatedAt", void 0);
exports.TeamAnalytics = TeamAnalytics = __decorate([
    (0, typeorm_1.Entity)('team_analytics'),
    (0, typeorm_1.Index)(['teamId', 'seasonId', 'date']),
    (0, typeorm_1.Index)(['organizationId', 'date']),
    (0, typeorm_1.Index)(['gameType', 'date'])
], TeamAnalytics);
//# sourceMappingURL=TeamAnalytics.js.map