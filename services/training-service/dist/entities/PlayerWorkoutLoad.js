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
exports.PlayerWorkoutLoad = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutSession_1 = require("./WorkoutSession");
let PlayerWorkoutLoad = class PlayerWorkoutLoad extends shared_lib_1.BaseEntity {
};
exports.PlayerWorkoutLoad = PlayerWorkoutLoad;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerWorkoutLoad.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 1.0 }),
    __metadata("design:type", Number)
], PlayerWorkoutLoad.prototype, "loadModifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlayerWorkoutLoad.prototype, "exerciseModifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PlayerWorkoutLoad.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PlayerWorkoutLoad.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => WorkoutSession_1.WorkoutSession, session => session.playerLoads, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workoutSessionId' }),
    __metadata("design:type", WorkoutSession_1.WorkoutSession)
], PlayerWorkoutLoad.prototype, "workoutSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerWorkoutLoad.prototype, "workoutSessionId", void 0);
exports.PlayerWorkoutLoad = PlayerWorkoutLoad = __decorate([
    (0, typeorm_1.Entity)('player_workout_loads')
], PlayerWorkoutLoad);
//# sourceMappingURL=PlayerWorkoutLoad.js.map