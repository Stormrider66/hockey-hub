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
exports.Injury = void 0;
const typeorm_1 = require("typeorm");
const MedicalNote_1 = require("./MedicalNote");
const PlayerStatusUpdate_1 = require("./PlayerStatusUpdate");
const InjuryUpdate_1 = require("./InjuryUpdate");
const types_1 = require("@hockey-hub/types");
let Injury = class Injury {
};
exports.Injury = Injury;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Injury.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Injury.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Injury.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Injury.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: types_1.InjuryType }),
    __metadata("design:type", String)
], Injury.prototype, "injuryType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Injury.prototype, "bodyPart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Injury.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: types_1.InjuryStatus }),
    __metadata("design:type", String)
], Injury.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: types_1.InjurySeverity }),
    __metadata("design:type", String)
], Injury.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], Injury.prototype, "dateOfInjury", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Injury.prototype, "expectedRecoveryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Injury.prototype, "actualRecoveryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Injury.prototype, "reportedById", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalNote_1.MedicalNote, note => note.injury),
    __metadata("design:type", Array)
], Injury.prototype, "medicalNotes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PlayerStatusUpdate_1.PlayerStatusUpdate, update => update.relatedInjury),
    __metadata("design:type", Array)
], Injury.prototype, "statusUpdates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InjuryUpdate_1.InjuryUpdate, update => update.injury),
    __metadata("design:type", Array)
], Injury.prototype, "updates", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], Injury.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], Injury.prototype, "updatedAt", void 0);
exports.Injury = Injury = __decorate([
    (0, typeorm_1.Entity)('injuries'),
    (0, typeorm_1.Index)(['playerId', 'dateOfInjury']),
    (0, typeorm_1.Index)(['organizationId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['injuryType'])
], Injury);
