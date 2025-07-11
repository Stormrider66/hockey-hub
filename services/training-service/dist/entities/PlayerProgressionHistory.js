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
exports.PlayerProgressionHistory = exports.PerformanceCategory = exports.ProgressionPeriod = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
var ProgressionPeriod;
(function (ProgressionPeriod) {
    ProgressionPeriod["WEEKLY"] = "weekly";
    ProgressionPeriod["MONTHLY"] = "monthly";
    ProgressionPeriod["QUARTERLY"] = "quarterly";
    ProgressionPeriod["SEASONAL"] = "seasonal";
    ProgressionPeriod["YEARLY"] = "yearly";
})(ProgressionPeriod || (exports.ProgressionPeriod = ProgressionPeriod = {}));
var PerformanceCategory;
(function (PerformanceCategory) {
    PerformanceCategory["STRENGTH"] = "strength";
    PerformanceCategory["SPEED"] = "speed";
    PerformanceCategory["ENDURANCE"] = "endurance";
    PerformanceCategory["POWER"] = "power";
    PerformanceCategory["FLEXIBILITY"] = "flexibility";
    PerformanceCategory["SKILL"] = "skill";
    PerformanceCategory["RECOVERY"] = "recovery";
    PerformanceCategory["OVERALL"] = "overall";
})(PerformanceCategory || (exports.PerformanceCategory = PerformanceCategory = {}));
let PlayerProgressionHistory = class PlayerProgressionHistory extends shared_lib_1.BaseEntity {
};
exports.PlayerProgressionHistory = PlayerProgressionHistory;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_progression_player'),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "seasonId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProgressionPeriod }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "periodType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PlayerProgressionHistory.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PlayerProgressionHistory.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PerformanceCategory }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PlayerProgressionHistory.prototype, "ageAtPeriod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "workoutMetrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "performanceMetrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "comparisonMetrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "healthMetrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], PlayerProgressionHistory.prototype, "coachingNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "externalData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], PlayerProgressionHistory.prototype, "overallProgressionScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], PlayerProgressionHistory.prototype, "progressionTrend", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "recommendations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerProgressionHistory.prototype, "eventBusMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PlayerProgressionHistory.prototype, "version", void 0);
exports.PlayerProgressionHistory = PlayerProgressionHistory = __decorate([
    (0, typeorm_1.Entity)('player_progression_history'),
    (0, typeorm_1.Unique)(['playerId', 'periodType', 'periodStart']),
    (0, typeorm_1.Index)('idx_progression_player_date', ['playerId', 'periodStart', 'periodEnd']),
    (0, typeorm_1.Index)('idx_progression_organization_season', ['organizationId', 'seasonId']),
    (0, typeorm_1.Index)('idx_progression_team_category', ['teamId', 'category']),
    (0, typeorm_1.Index)('idx_progression_age_position', ['ageAtPeriod', 'position'])
], PlayerProgressionHistory);
//# sourceMappingURL=PlayerProgressionHistory.js.map