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
exports.WellnessEntry = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let WellnessEntry = class WellnessEntry extends shared_lib_1.AuditableEntity {
};
exports.WellnessEntry = WellnessEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_date', type: 'date' }),
    __metadata("design:type", Date)
], WellnessEntry.prototype, "entryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sleep_hours', type: 'decimal', precision: 4, scale: 2 }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "sleepHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sleep_quality', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "sleepQuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'energy_level', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "energyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stress_level', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "stressLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'soreness_level', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "sorenessLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hydration_level', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "hydrationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nutrition_quality', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "nutritionQuality", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mood_rating', type: 'int' }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "moodRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resting_heart_rate', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "restingHeartRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hrv_score', type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "hrvScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'body_weight', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WellnessEntry.prototype, "bodyWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WellnessEntry.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pain_areas', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], WellnessEntry.prototype, "painAreas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medications', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], WellnessEntry.prototype, "medications", void 0);
exports.WellnessEntry = WellnessEntry = __decorate([
    (0, typeorm_1.Entity)('wellness_entries')
], WellnessEntry);
//# sourceMappingURL=WellnessEntry.js.map