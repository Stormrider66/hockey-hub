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
exports.Exercise = exports.Difficulty = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("@hockey-hub/types");
var Difficulty;
(function (Difficulty) {
    Difficulty["BEGINNER"] = "beginner";
    Difficulty["INTERMEDIATE"] = "intermediate";
    Difficulty["ADVANCED"] = "advanced";
})(Difficulty || (exports.Difficulty = Difficulty = {}));
let Exercise = class Exercise {
};
exports.Exercise = Exercise;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Exercise.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Exercise.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Exercise.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Exercise.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: types_1.ExerciseCategory
    }),
    __metadata("design:type", String)
], Exercise.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2048, nullable: true }),
    __metadata("design:type", String)
], Exercise.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Exercise.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Exercise.prototype, "muscleGroups", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Exercise.prototype, "equipmentNeeded", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Difficulty,
    }),
    __metadata("design:type", String)
], Exercise.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2048, nullable: true }),
    __metadata("design:type", String)
], Exercise.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Exercise.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Exercise.prototype, "is_public", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], Exercise.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], Exercise.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ nullable: true }),
    __metadata("design:type", Date)
], Exercise.prototype, "deletedAt", void 0);
exports.Exercise = Exercise = __decorate([
    (0, typeorm_1.Entity)('exercises'),
    (0, typeorm_1.Index)(['organizationId', 'name']),
    (0, typeorm_1.Index)(['createdByUserId']),
    (0, typeorm_1.Index)(['is_public'])
], Exercise);
