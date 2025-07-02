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
exports.NotificationQueue = exports.QueueStatus = void 0;
const typeorm_1 = require("typeorm");
const Notification_1 = require("./Notification");
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["PENDING"] = "pending";
    QueueStatus["PROCESSING"] = "processing";
    QueueStatus["COMPLETED"] = "completed";
    QueueStatus["FAILED"] = "failed";
    QueueStatus["CANCELLED"] = "cancelled";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
let NotificationQueue = class NotificationQueue {
};
exports.NotificationQueue = NotificationQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], NotificationQueue.prototype, "notification_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Notification_1.NotificationChannel,
    }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Notification_1.NotificationPriority,
        default: Notification_1.NotificationPriority.NORMAL,
    }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueStatus,
        default: QueueStatus.PENDING,
    }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "scheduled_for", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "attempt_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3 }),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "max_attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "next_attempt_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NotificationQueue.prototype, "processing_data", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "updated_at", void 0);
exports.NotificationQueue = NotificationQueue = __decorate([
    (0, typeorm_1.Entity)('notification_queue'),
    (0, typeorm_1.Index)(['status', 'scheduled_for']),
    (0, typeorm_1.Index)(['channel', 'priority']),
    (0, typeorm_1.Index)(['notification_id'])
], NotificationQueue);
//# sourceMappingURL=NotificationQueue.js.map