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
exports.MedicalReport = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const Injury_1 = require("./Injury");
let MedicalReport = class MedicalReport extends shared_lib_1.AuditableEntity {
};
exports.MedicalReport = MedicalReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MedicalReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", Number)
], MedicalReport.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'injury_id', nullable: true }),
    __metadata("design:type", Number)
], MedicalReport.prototype, "injuryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_date', type: 'date' }),
    __metadata("design:type", Date)
], MedicalReport.prototype, "reportDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_type', length: 255 }),
    __metadata("design:type", String)
], MedicalReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MedicalReport.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MedicalReport.prototype, "recommendations", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medical_professional', length: 255 }),
    __metadata("design:type", String)
], MedicalReport.prototype, "medicalProfessional", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clearance_status', length: 50, default: 'pending' }),
    __metadata("design:type", String)
], MedicalReport.prototype, "clearanceStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follow_up_required', default: false }),
    __metadata("design:type", Boolean)
], MedicalReport.prototype, "followUpRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'follow_up_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], MedicalReport.prototype, "followUpDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], MedicalReport.prototype, "documentUrl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Injury_1.Injury, injury => injury.medicalReports, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'injury_id' }),
    __metadata("design:type", Injury_1.Injury)
], MedicalReport.prototype, "injury", void 0);
exports.MedicalReport = MedicalReport = __decorate([
    (0, typeorm_1.Entity)('medical_reports')
], MedicalReport);
//# sourceMappingURL=MedicalReport.js.map