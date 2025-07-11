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
exports.SessionTemplate = exports.DifficultyLevel = exports.TemplateVisibility = exports.TemplateCategory = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutType_1 = require("./WorkoutType");
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["PRE_SEASON"] = "pre_season";
    TemplateCategory["IN_SEASON"] = "in_season";
    TemplateCategory["POST_SEASON"] = "post_season";
    TemplateCategory["RECOVERY"] = "recovery";
    TemplateCategory["STRENGTH"] = "strength";
    TemplateCategory["CONDITIONING"] = "conditioning";
    TemplateCategory["SKILL_DEVELOPMENT"] = "skill_development";
    TemplateCategory["INJURY_PREVENTION"] = "injury_prevention";
    TemplateCategory["CUSTOM"] = "custom";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
var TemplateVisibility;
(function (TemplateVisibility) {
    TemplateVisibility["PRIVATE"] = "private";
    TemplateVisibility["TEAM"] = "team";
    TemplateVisibility["ORGANIZATION"] = "organization";
    TemplateVisibility["PUBLIC"] = "public";
})(TemplateVisibility || (exports.TemplateVisibility = TemplateVisibility = {}));
var DifficultyLevel;
(function (DifficultyLevel) {
    DifficultyLevel["BEGINNER"] = "beginner";
    DifficultyLevel["INTERMEDIATE"] = "intermediate";
    DifficultyLevel["ADVANCED"] = "advanced";
    DifficultyLevel["PROFESSIONAL"] = "professional";
})(DifficultyLevel || (exports.DifficultyLevel = DifficultyLevel = {}));
let SessionTemplate = class SessionTemplate extends shared_lib_1.BaseEntity {
};
exports.SessionTemplate = SessionTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SessionTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TemplateCategory,
        default: TemplateCategory.CUSTOM,
    }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkoutType_1.WorkoutType,
        default: WorkoutType_1.WorkoutType.MIXED,
    }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DifficultyLevel,
        default: DifficultyLevel.INTERMEDIATE,
    }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TemplateVisibility,
        default: TemplateVisibility.PRIVATE,
    }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], SessionTemplate.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], SessionTemplate.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SessionTemplate.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 60 }),
    __metadata("design:type", Number)
], SessionTemplate.prototype, "estimatedDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SessionTemplate.prototype, "exercises", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SessionTemplate.prototype, "warmup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SessionTemplate.prototype, "cooldown", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SessionTemplate.prototype, "equipment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SessionTemplate.prototype, "targetGroups", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SessionTemplate.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SessionTemplate.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], SessionTemplate.prototype, "usageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SessionTemplate.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], SessionTemplate.prototype, "ratingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SessionTemplate.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SessionTemplate.prototype, "isSystemTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SessionTemplate.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SessionTemplate.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SessionTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SessionTemplate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionTemplate.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionTemplate.prototype, "deletedAt", void 0);
exports.SessionTemplate = SessionTemplate = __decorate([
    (0, typeorm_1.Entity)('session_templates'),
    (0, typeorm_1.Index)(['organizationId', 'isActive']),
    (0, typeorm_1.Index)(['createdBy', 'isActive']),
    (0, typeorm_1.Index)(['category', 'visibility']),
    (0, typeorm_1.Index)(['type', 'difficulty'])
], SessionTemplate);
//# sourceMappingURL=SessionTemplate.js.map