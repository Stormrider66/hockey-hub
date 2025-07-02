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
exports.MessageReadReceipt = void 0;
const typeorm_1 = require("typeorm");
const Message_1 = require("./Message");
let MessageReadReceipt = class MessageReadReceipt {
};
exports.MessageReadReceipt = MessageReadReceipt;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], MessageReadReceipt.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], MessageReadReceipt.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageReadReceipt.prototype, "read_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Message_1.Message, (message) => message.read_receipts, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'message_id' }),
    __metadata("design:type", Message_1.Message)
], MessageReadReceipt.prototype, "message", void 0);
exports.MessageReadReceipt = MessageReadReceipt = __decorate([
    (0, typeorm_1.Entity)('message_read_receipts'),
    (0, typeorm_1.Index)(['message_id']),
    (0, typeorm_1.Index)(['user_id'])
], MessageReadReceipt);
//# sourceMappingURL=MessageReadReceipt.js.map