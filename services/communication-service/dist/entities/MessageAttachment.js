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
exports.MessageAttachment = exports.AttachmentType = void 0;
const typeorm_1 = require("typeorm");
const Message_1 = require("./Message");
var AttachmentType;
(function (AttachmentType) {
    AttachmentType["IMAGE"] = "image";
    AttachmentType["VIDEO"] = "video";
    AttachmentType["AUDIO"] = "audio";
    AttachmentType["DOCUMENT"] = "document";
    AttachmentType["OTHER"] = "other";
})(AttachmentType || (exports.AttachmentType = AttachmentType = {}));
let MessageAttachment = class MessageAttachment {
};
exports.MessageAttachment = MessageAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MessageAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], MessageAttachment.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MessageAttachment.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MessageAttachment.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MessageAttachment.prototype, "file_type", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", Number)
], MessageAttachment.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MessageAttachment.prototype, "thumbnail_url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AttachmentType,
        default: AttachmentType.OTHER,
    }),
    __metadata("design:type", String)
], MessageAttachment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MessageAttachment.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MessageAttachment.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MessageAttachment.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageAttachment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], MessageAttachment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Message_1.Message, (message) => message.attachments, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'message_id' }),
    __metadata("design:type", Message_1.Message)
], MessageAttachment.prototype, "message", void 0);
exports.MessageAttachment = MessageAttachment = __decorate([
    (0, typeorm_1.Entity)('message_attachments'),
    (0, typeorm_1.Index)(['message_id'])
], MessageAttachment);
//# sourceMappingURL=MessageAttachment.js.map