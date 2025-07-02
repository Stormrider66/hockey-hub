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
exports.ConversationParticipant = exports.ParticipantRole = void 0;
const typeorm_1 = require("typeorm");
const Conversation_1 = require("./Conversation");
var ParticipantRole;
(function (ParticipantRole) {
    ParticipantRole["ADMIN"] = "admin";
    ParticipantRole["MEMBER"] = "member";
    ParticipantRole["OBSERVER"] = "observer";
})(ParticipantRole || (exports.ParticipantRole = ParticipantRole = {}));
let ConversationParticipant = class ConversationParticipant {
};
exports.ConversationParticipant = ConversationParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "conversation_id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParticipantRole,
        default: ParticipantRole.MEMBER,
    }),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "joined_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "left_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "last_read_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ConversationParticipant.prototype, "notifications_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ConversationParticipant.prototype, "is_muted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "muted_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "nickname", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Conversation_1.Conversation, (conversation) => conversation.participants, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", Conversation_1.Conversation)
], ConversationParticipant.prototype, "conversation", void 0);
exports.ConversationParticipant = ConversationParticipant = __decorate([
    (0, typeorm_1.Entity)('conversation_participants'),
    (0, typeorm_1.Unique)(['conversation_id', 'user_id']),
    (0, typeorm_1.Index)(['user_id', 'left_at']),
    (0, typeorm_1.Index)(['conversation_id', 'user_id'])
], ConversationParticipant);
//# sourceMappingURL=ConversationParticipant.js.map