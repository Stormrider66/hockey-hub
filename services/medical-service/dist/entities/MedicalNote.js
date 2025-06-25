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
exports.MedicalNote = void 0;
const typeorm_1 = require("typeorm");
const Injury_1 = require("./Injury");
const MedicalAssessment_1 = require("./MedicalAssessment");
let MedicalNote = class MedicalNote {
};
exports.MedicalNote = MedicalNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MedicalNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MedicalNote.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MedicalNote.prototype, "injuryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MedicalNote.prototype, "assessmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalNote.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MedicalNote.prototype, "recordedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Injury_1.Injury, injury => injury.medicalNotes, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'injuryId' }),
    __metadata("design:type", Object)
], MedicalNote.prototype, "injury", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MedicalAssessment_1.MedicalAssessment, assessment => assessment.medicalNotes, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assessmentId' }),
    __metadata("design:type", Object)
], MedicalNote.prototype, "assessment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], MedicalNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], MedicalNote.prototype, "updatedAt", void 0);
exports.MedicalNote = MedicalNote = __decorate([
    (0, typeorm_1.Entity)('medical_notes'),
    (0, typeorm_1.Index)(['playerId']),
    (0, typeorm_1.Index)(['injuryId']),
    (0, typeorm_1.Index)(['assessmentId']),
    (0, typeorm_1.Index)(['recordedById'])
], MedicalNote);
