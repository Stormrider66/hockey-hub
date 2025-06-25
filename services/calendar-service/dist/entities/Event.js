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
exports.Event = exports.EventRepetition = exports.EventStatus = exports.EventType = void 0;
const typeorm_1 = require("typeorm");
const Location_1 = require("./Location");
const EventAttendee_1 = require("./EventAttendee");
const EventResource_1 = require("./EventResource");
var EventType;
(function (EventType) {
    EventType["ICE_TRAINING"] = "ice-training";
    EventType["PHYSICAL_TRAINING"] = "physical-training";
    EventType["GAME"] = "game";
    EventType["MEETING"] = "meeting";
    EventType["MEDICAL"] = "medical";
    EventType["TRAVEL"] = "travel";
    EventType["OTHER"] = "other";
})(EventType || (exports.EventType = EventType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["PLANNED"] = "scheduled";
    EventStatus["CANCELED"] = "canceled";
    EventStatus["COMPLETED"] = "completed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventRepetition;
(function (EventRepetition) {
    EventRepetition["NONE"] = "NONE";
    EventRepetition["DAILY"] = "DAILY";
    EventRepetition["WEEKLY"] = "WEEKLY";
    EventRepetition["MONTHLY"] = "MONTHLY";
})(EventRepetition || (exports.EventRepetition = EventRepetition = {}));
let Event = class Event {
};
exports.Event = Event;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Event.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', array: true, nullable: true }),
    __metadata("design:type", Array)
], Event.prototype, "teamIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Event.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EventType,
    }),
    __metadata("design:type", String)
], Event.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.PLANNED
    }),
    __metadata("design:type", String)
], Event.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", String)
], Event.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", String)
], Event.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Event.prototype, "isAllDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Location_1.Location, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", Location_1.Location)
], Event.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2048, nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "locationUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventResource_1.EventResource, eventResource => eventResource.event),
    __metadata("design:type", Array)
], Event.prototype, "eventResources", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventAttendee_1.EventAttendee, attendee => attendee.event),
    __metadata("design:type", Array)
], Event.prototype, "attendees", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EventRepetition,
        default: EventRepetition.NONE
    }),
    __metadata("design:type", String)
], Event.prototype, "repetition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "repetitionEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "relatedTrainingSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "relatedGameId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", String)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", String)
], Event.prototype, "updatedAt", void 0);
exports.Event = Event = __decorate([
    (0, typeorm_1.Entity)('events'),
    (0, typeorm_1.Index)(['organizationId', 'startTime']),
    (0, typeorm_1.Index)(['organizationId', 'eventType'])
], Event);
