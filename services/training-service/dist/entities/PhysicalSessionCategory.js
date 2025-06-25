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
exports.PhysicalSessionCategory = void 0;
const typeorm_1 = require("typeorm");
const PhysicalSessionTemplate_1 = require("./PhysicalSessionTemplate");
let PhysicalSessionCategory = class PhysicalSessionCategory {
};
exports.PhysicalSessionCategory = PhysicalSessionCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhysicalSessionCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionCategory.prototype, "created_by_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PhysicalSessionCategory.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PhysicalSessionCategory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PhysicalSessionCategory.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PhysicalSessionTemplate_1.PhysicalSessionTemplate, template => template.category),
    __metadata("design:type", Promise)
], PhysicalSessionCategory.prototype, "templates", void 0);
exports.PhysicalSessionCategory = PhysicalSessionCategory = __decorate([
    (0, typeorm_1.Entity)('physical_session_categories'),
    (0, typeorm_1.Index)(['name', 'organization_id'], { unique: true })
], PhysicalSessionCategory);
