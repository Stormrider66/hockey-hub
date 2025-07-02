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
exports.UserPresence = exports.PresenceStatus = void 0;
const typeorm_1 = require("typeorm");
var PresenceStatus;
(function (PresenceStatus) {
    PresenceStatus["ONLINE"] = "online";
    PresenceStatus["AWAY"] = "away";
    PresenceStatus["BUSY"] = "busy";
    PresenceStatus["OFFLINE"] = "offline";
})(PresenceStatus || (exports.PresenceStatus = PresenceStatus = {}));
let UserPresence = class UserPresence {
};
exports.UserPresence = UserPresence;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], UserPresence.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PresenceStatus,
        default: PresenceStatus.OFFLINE,
    }),
    __metadata("design:type", String)
], UserPresence.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserPresence.prototype, "last_seen_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], UserPresence.prototype, "status_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserPresence.prototype, "active_device", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserPresence.prototype, "device_info", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserPresence.prototype, "away_since", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserPresence.prototype, "busy_until", void 0);
exports.UserPresence = UserPresence = __decorate([
    (0, typeorm_1.Entity)('user_presence'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['last_seen_at'])
], UserPresence);
//# sourceMappingURL=UserPresence.js.map