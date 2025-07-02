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
exports.MessageReaction = void 0;
const typeorm_1 = require("typeorm");
const Message_1 = require("./Message");
let MessageReaction = class MessageReaction {
};
exports.MessageReaction = MessageReaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MessageReaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], MessageReaction.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], MessageReaction.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MessageReaction.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageReaction.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Message_1.Message, (message) => message.reactions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'message_id' }),
    __metadata("design:type", Message_1.Message)
], MessageReaction.prototype, "message", void 0);
exports.MessageReaction = MessageReaction = __decorate([
    (0, typeorm_1.Entity)('message_reactions'),
    (0, typeorm_1.Unique)(['message_id', 'user_id', 'emoji']),
    (0, typeorm_1.Index)(['message_id']),
    (0, typeorm_1.Index)(['user_id'])
], MessageReaction);
//# sourceMappingURL=MessageReaction.js.map