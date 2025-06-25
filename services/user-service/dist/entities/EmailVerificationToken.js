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
exports.EmailVerificationToken = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let EmailVerificationToken = class EmailVerificationToken {
};
exports.EmailVerificationToken = EmailVerificationToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailVerificationToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], EmailVerificationToken.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: false, lazy: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Promise)
], EmailVerificationToken.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], EmailVerificationToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], EmailVerificationToken.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], EmailVerificationToken.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], EmailVerificationToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], EmailVerificationToken.prototype, "updatedAt", void 0);
exports.EmailVerificationToken = EmailVerificationToken = __decorate([
    (0, typeorm_1.Entity)('email_verification_tokens'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['expiresAt']),
    (0, typeorm_1.Index)(['userId', 'verifiedAt'])
], EmailVerificationToken);
//# sourceMappingURL=EmailVerificationToken.js.map