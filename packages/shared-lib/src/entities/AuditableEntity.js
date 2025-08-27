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
exports.auditContextMiddleware = exports.clearRequestContext = exports.setRequestContext = exports.AuditableEntity = void 0;
const typeorm_1 = require("typeorm");
/**
 * Base entity with audit columns that tracks who created/updated records
 * Includes UUID primary key for consistency
 */
class AuditableEntity extends typeorm_1.BaseEntity {
    /**
     * Set audit fields before insert
     */
    setCreateAuditFields() {
        const context = global.__requestContext;
        if (context) {
            this.createdBy = context.userId || 'system';
            this.lastRequestId = context.requestId;
            this.lastIpAddress = context.ipAddress;
        }
    }
    /**
     * Set audit fields before update
     */
    setUpdateAuditFields() {
        const context = global.__requestContext;
        if (context) {
            this.updatedBy = context.userId || 'system';
            this.lastRequestId = context.requestId;
            this.lastIpAddress = context.ipAddress;
        }
    }
    /**
     * Soft delete with audit info
     */
    softDelete(userId) {
        this.deletedAt = new Date();
        this.deletedBy = userId || global.__requestContext?.userId || 'system';
    }
    /**
     * Check if entity is deleted
     */
    get isDeleted() {
        return !!this.deletedAt;
    }
}
exports.AuditableEntity = AuditableEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditableEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AuditableEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AuditableEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditableEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditableEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], AuditableEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditableEntity.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AuditableEntity.prototype, "lastRequestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AuditableEntity.prototype, "lastIpAddress", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuditableEntity.prototype, "setCreateAuditFields", null);
__decorate([
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuditableEntity.prototype, "setUpdateAuditFields", null);
/**
 * Helper to set request context for audit fields
 */
function setRequestContext(context) {
    global.__requestContext = context;
}
exports.setRequestContext = setRequestContext;
/**
 * Helper to clear request context
 */
function clearRequestContext() {
    delete global.__requestContext;
}
exports.clearRequestContext = clearRequestContext;
/**
 * Middleware to automatically set request context
 */
function auditContextMiddleware(req, res, next) {
    setRequestContext({
        userId: req.user?.id || 'anonymous',
        requestId: req.id || req.headers['x-request-id'],
        ipAddress: req.ip || req.connection?.remoteAddress,
        organizationId: req.user?.organizationId,
        role: req.user?.role,
    });
    // Clear context after response
    res.on('finish', () => {
        clearRequestContext();
    });
    next();
}
exports.auditContextMiddleware = auditContextMiddleware;
//# sourceMappingURL=AuditableEntity.js.map