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
exports.PlayerAvailability = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const Injury_1 = require("./Injury");
let PlayerAvailability = class PlayerAvailability extends shared_lib_1.AuditableEntity {
};
exports.PlayerAvailability = PlayerAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PlayerAvailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", Number)
], PlayerAvailability.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'effective_date', type: 'date' }),
    __metadata("design:type", Date)
], PlayerAvailability.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'availability_status',
        type: 'enum',
        enum: ['available', 'injured', 'illness', 'personal', 'suspended', 'load_management'],
        default: 'available'
    }),
    __metadata("design:type", String)
], PlayerAvailability.prototype, "availabilityStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'injury_id', nullable: true }),
    __metadata("design:type", Number)
], PlayerAvailability.prototype, "injuryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlayerAvailability.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expected_return_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PlayerAvailability.prototype, "expectedReturnDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medical_clearance_required', default: false }),
    __metadata("design:type", Boolean)
], PlayerAvailability.prototype, "medicalClearanceRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clearance_provided', default: false }),
    __metadata("design:type", Boolean)
], PlayerAvailability.prototype, "clearanceProvided", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clearance_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PlayerAvailability.prototype, "clearanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cleared_by', length: 255, nullable: true }),
    __metadata("design:type", String)
], PlayerAvailability.prototype, "clearedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restrictions', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], PlayerAvailability.prototype, "restrictions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_current', default: true }),
    __metadata("design:type", Boolean)
], PlayerAvailability.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Injury_1.Injury, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'injury_id' }),
    __metadata("design:type", Injury_1.Injury)
], PlayerAvailability.prototype, "injury", void 0);
exports.PlayerAvailability = PlayerAvailability = __decorate([
    (0, typeorm_1.Entity)('player_availability')
], PlayerAvailability);
//# sourceMappingURL=PlayerAvailability.js.map