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
exports.Organization = void 0;
const typeorm_1 = require("typeorm");
const Team_1 = require("./Team");
const User_1 = require("./User");
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_number', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "organizationNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'postal_code', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'primary_color', type: 'varchar', length: 7, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "primaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secondary_color', type: 'varchar', length: 7, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "secondaryColor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true, select: false }),
    __metadata("design:type", Date)
], Organization.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Team_1.Team, (team) => team.organization),
    __metadata("design:type", Array)
], Organization.prototype, "teams", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, (user) => user.organization),
    __metadata("design:type", Array)
], Organization.prototype, "users", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)('organizations'),
    (0, typeorm_1.Index)(['name'])
], Organization);
//# sourceMappingURL=Organization.js.map