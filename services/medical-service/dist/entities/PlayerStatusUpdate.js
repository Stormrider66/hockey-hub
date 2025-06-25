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
exports.PlayerStatusUpdate = void 0;
const typeorm_1 = require("typeorm");
const Injury_1 = require("./Injury");
const types_1 = require("@hockey-hub/types");
let PlayerStatusUpdate = class PlayerStatusUpdate {
};
exports.PlayerStatusUpdate = PlayerStatusUpdate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PlayerStatusUpdate.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: types_1.PlayerAvailabilityStatus }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PlayerStatusUpdate.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PlayerStatusUpdate.prototype, "relatedInjuryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Injury_1.Injury, injury => injury.statusUpdates, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'relatedInjuryId' }),
    __metadata("design:type", Object)
], PlayerStatusUpdate.prototype, "relatedInjury", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "updatedById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], PlayerStatusUpdate.prototype, "updatedAt", void 0);
exports.PlayerStatusUpdate = PlayerStatusUpdate = __decorate([
    (0, typeorm_1.Entity)('player_status_updates'),
    (0, typeorm_1.Index)(['playerId', 'effectiveDate']),
    (0, typeorm_1.Index)(['organizationId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['relatedInjuryId'])
], PlayerStatusUpdate);
