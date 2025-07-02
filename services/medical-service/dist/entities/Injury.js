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
const shared_lib_1 = require("@hockey-hub/shared-lib");
const Treatment_1 = require("./Treatment");
const MedicalReport_1 = require("./MedicalReport");
let Injury = class Injury extends shared_lib_1.AuditableEntity {
};
exports.Injury = Injury;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Injury.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", Number)
], Injury.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'injury_type', length: 255 }),
    __metadata("design:type", String)
], Injury.prototype, "injuryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'injury_date', type: 'date' }),
    __metadata("design:type", Date)
], Injury.prototype, "injuryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'recovery_status',
        type: 'enum',
        enum: ['active', 'recovering', 'recovered'],
        default: 'active'
    }),
    __metadata("design:type", String)
], Injury.prototype, "recoveryStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expected_return_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Injury.prototype, "expectedReturnDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Injury.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'severity_level', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Injury.prototype, "severityLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'body_part', length: 100 }),
    __metadata("design:type", String)
], Injury.prototype, "bodyPart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mechanism_of_injury', length: 255, nullable: true }),
    __metadata("design:type", String)
], Injury.prototype, "mechanismOfInjury", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Injury.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Treatment_1.Treatment, treatment => treatment.injury, { cascade: true }),
    __metadata("design:type", Array)
], Injury.prototype, "treatments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalReport_1.MedicalReport, report => report.injury, { cascade: true }),
    __metadata("design:type", Array)
], Injury.prototype, "medicalReports", void 0);
exports.Injury = Injury = __decorate([
    (0, typeorm_1.Entity)('injuries')
], Injury);
//# sourceMappingURL=Injury.js.map