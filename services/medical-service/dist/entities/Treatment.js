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
exports.Treatment = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const Injury_1 = require("./Injury");
let Treatment = class Treatment extends shared_lib_1.AuditableEntity {
};
exports.Treatment = Treatment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Treatment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'injury_id' }),
    __metadata("design:type", Number)
], Treatment.prototype, "injuryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'treatment_date', type: 'date' }),
    __metadata("design:type", Date)
], Treatment.prototype, "treatmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'treatment_type', length: 255 }),
    __metadata("design:type", String)
], Treatment.prototype, "treatmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Treatment.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_minutes', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'effectiveness_rating', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "effectivenessRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_completed', default: false }),
    __metadata("design:type", Boolean)
], Treatment.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Injury_1.Injury, injury => injury.treatments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'injury_id' }),
    __metadata("design:type", Injury_1.Injury)
], Treatment.prototype, "injury", void 0);
exports.Treatment = Treatment = __decorate([
    (0, typeorm_1.Entity)('treatments')
], Treatment);
//# sourceMappingURL=Treatment.js.map