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
exports.PhysicalSessionTemplate = void 0;
const typeorm_1 = require("typeorm");
const PhysicalSessionCategory_1 = require("./PhysicalSessionCategory"); // This entity also needs to exist
let PhysicalSessionTemplate = class PhysicalSessionTemplate {
};
exports.PhysicalSessionTemplate = PhysicalSessionTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PhysicalSessionCategory_1.PhysicalSessionCategory, { lazy: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", Promise)
], PhysicalSessionTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "created_by_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], PhysicalSessionTemplate.prototype, "structure", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], PhysicalSessionTemplate.prototype, "is_public", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionTemplate.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PhysicalSessionTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PhysicalSessionTemplate.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ nullable: true }),
    __metadata("design:type", Date)
], PhysicalSessionTemplate.prototype, "deleted_at", void 0);
exports.PhysicalSessionTemplate = PhysicalSessionTemplate = __decorate([
    (0, typeorm_1.Entity)('physical_session_templates'),
    (0, typeorm_1.Index)(['categoryId', 'organization_id'])
], PhysicalSessionTemplate);
