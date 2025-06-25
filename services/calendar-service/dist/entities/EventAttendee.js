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
exports.EventAttendee = exports.AttendeeStatus = void 0;
const typeorm_1 = require("typeorm");
const Event_1 = require("./Event");
var AttendeeStatus;
(function (AttendeeStatus) {
    AttendeeStatus["INVITED"] = "invited";
    AttendeeStatus["ATTENDING"] = "attending";
    AttendeeStatus["ABSENT"] = "absent";
    AttendeeStatus["MAYBE"] = "maybe";
})(AttendeeStatus || (exports.AttendeeStatus = AttendeeStatus = {}));
let EventAttendee = class EventAttendee {
};
exports.EventAttendee = EventAttendee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EventAttendee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EventAttendee.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EventAttendee.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AttendeeStatus,
        default: AttendeeStatus.INVITED
    }),
    __metadata("design:type", String)
], EventAttendee.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EventAttendee.prototype, "reasonForAbsence", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Event_1.Event, event => event.attendees, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'eventId' }),
    __metadata("design:type", Event_1.Event)
], EventAttendee.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", String)
], EventAttendee.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", String)
], EventAttendee.prototype, "updatedAt", void 0);
exports.EventAttendee = EventAttendee = __decorate([
    (0, typeorm_1.Entity)('event_attendees'),
    (0, typeorm_1.Index)(['eventId', 'userId'], { unique: true }) // Ensure user isn't added twice to same event
], EventAttendee);
