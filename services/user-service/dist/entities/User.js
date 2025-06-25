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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("./Role");
const TeamMember_1 = require("./TeamMember");
const PlayerParentLink_1 = require("./PlayerParentLink");
const RefreshToken_1 = require("./RefreshToken");
const Organization_1 = require("./Organization");
const PasswordResetToken_1 = require("./PasswordResetToken");
const EmailVerificationToken_1 = require("./EmailVerificationToken");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preferred_language', type: 'varchar', length: 10, default: 'sv' }),
    __metadata("design:type", String)
], User.prototype, "preferredLanguage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'inactive', 'pending'], default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "passwordResetToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_reset_expires', type: 'timestamp with time zone', nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "passwordResetExpires", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true, select: false }),
    __metadata("design:type", Date)
], User.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Role_1.Role, (role) => role.users, { cascade: ['insert', 'update'] }),
    (0, typeorm_1.JoinTable)({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], User.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeamMember_1.TeamMember, (teamMember) => teamMember.user),
    __metadata("design:type", Array)
], User.prototype, "teamMemberships", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PlayerParentLink_1.PlayerParentLink, (link) => link.parent),
    __metadata("design:type", Array)
], User.prototype, "childLinks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PlayerParentLink_1.PlayerParentLink, (link) => link.child),
    __metadata("design:type", Array)
], User.prototype, "parentLinks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Organization_1.Organization, { nullable: true, lazy: true }),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", Promise)
], User.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RefreshToken_1.RefreshToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "refreshTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PasswordResetToken_1.PasswordResetToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "passwordResetTokens", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EmailVerificationToken_1.EmailVerificationToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "emailVerificationTokens", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Check)(`"status" IN ('active', 'inactive', 'pending')`),
    (0, typeorm_1.Index)(['email'], { unique: true }),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['preferredLanguage'])
], User);
//# sourceMappingURL=User.js.map