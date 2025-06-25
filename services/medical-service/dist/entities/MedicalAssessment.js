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
exports.MedicalAssessment = void 0;
const typeorm_1 = require("typeorm");
const MedicalNote_1 = require("./MedicalNote");
let MedicalAssessment = class MedicalAssessment {
};
exports.MedicalAssessment = MedicalAssessment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], MedicalAssessment.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "assessmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "assessmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "conductedById", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalNote_1.MedicalNote, note => note.assessment),
    __metadata("design:type", Array)
], MedicalAssessment.prototype, "medicalNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", String)
], MedicalAssessment.prototype, "updatedAt", void 0);
exports.MedicalAssessment = MedicalAssessment = __decorate([
    (0, typeorm_1.Entity)('medical_assessments'),
    (0, typeorm_1.Index)(['playerId', 'assessmentDate']),
    (0, typeorm_1.Index)(['organizationId']),
    (0, typeorm_1.Index)(['conductedById'])
], MedicalAssessment);
