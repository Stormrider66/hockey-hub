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
exports.NotificationTemplate = exports.TemplateFormat = void 0;
const typeorm_1 = require("typeorm");
const Notification_1 = require("./Notification");
var TemplateFormat;
(function (TemplateFormat) {
    TemplateFormat["TEXT"] = "text";
    TemplateFormat["HTML"] = "html";
    TemplateFormat["MARKDOWN"] = "markdown";
})(TemplateFormat || (exports.TemplateFormat = TemplateFormat = {}));
let NotificationTemplate = class NotificationTemplate {
};
exports.NotificationTemplate = NotificationTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 100 }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Notification_1.NotificationType,
    }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Notification_1.NotificationChannel,
    }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "organization_id", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 255 }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "subject_template", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "body_template", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TemplateFormat,
        default: TemplateFormat.TEXT,
    }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], NotificationTemplate.prototype, "variables", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], NotificationTemplate.prototype, "default_values", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 10, default: 'en' }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationTemplate.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], NotificationTemplate.prototype, "is_system_template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], NotificationTemplate.prototype, "usage_count", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationTemplate.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "updated_by", void 0);
exports.NotificationTemplate = NotificationTemplate = __decorate([
    (0, typeorm_1.Entity)('notification_templates'),
    (0, typeorm_1.Index)(['type', 'channel']),
    (0, typeorm_1.Index)(['organization_id'])
], NotificationTemplate);
//# sourceMappingURL=NotificationTemplate.js.map