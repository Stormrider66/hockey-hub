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
exports.CancelBookingDto = exports.ApproveBookingDto = exports.CreateResourceBookingDto = exports.CheckResourceAvailabilityDto = exports.UpdateResourceDto = exports.CreateResourceDto = exports.ResourceStatus = exports.ResourceType = exports.BulkAddParticipantsDto = exports.CheckConflictsDto = exports.RecurrenceRuleDto = exports.CreateRecurringEventDto = exports.UpdateParticipantStatusDto = exports.CreateParticipantDto = exports.UpdateEventDto = exports.CreateEventDto = exports.RecurrenceFrequency = exports.ParticipantStatus = exports.EventVisibility = exports.EventStatus = exports.EventType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
// Enums for calendar events
var EventType;
(function (EventType) {
    EventType["TRAINING"] = "training";
    EventType["GAME"] = "game";
    EventType["MEETING"] = "meeting";
    EventType["MEDICAL"] = "medical";
    EventType["EQUIPMENT"] = "equipment";
    EventType["TEAM_EVENT"] = "team_event";
    EventType["PERSONAL"] = "personal";
    EventType["OTHER"] = "other";
})(EventType || (exports.EventType = EventType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "draft";
    EventStatus["SCHEDULED"] = "scheduled";
    EventStatus["IN_PROGRESS"] = "in_progress";
    EventStatus["COMPLETED"] = "completed";
    EventStatus["CANCELLED"] = "cancelled";
    EventStatus["POSTPONED"] = "postponed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventVisibility;
(function (EventVisibility) {
    EventVisibility["PUBLIC"] = "public";
    EventVisibility["TEAM"] = "team";
    EventVisibility["PRIVATE"] = "private";
    EventVisibility["ROLE_BASED"] = "role_based";
})(EventVisibility || (exports.EventVisibility = EventVisibility = {}));
var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["INVITED"] = "invited";
    ParticipantStatus["ACCEPTED"] = "accepted";
    ParticipantStatus["DECLINED"] = "declined";
    ParticipantStatus["MAYBE"] = "maybe";
    ParticipantStatus["NOT_RESPONDED"] = "not_responded";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
var RecurrenceFrequency;
(function (RecurrenceFrequency) {
    RecurrenceFrequency["DAILY"] = "daily";
    RecurrenceFrequency["WEEKLY"] = "weekly";
    RecurrenceFrequency["MONTHLY"] = "monthly";
    RecurrenceFrequency["YEARLY"] = "yearly";
})(RecurrenceFrequency || (exports.RecurrenceFrequency = RecurrenceFrequency = {}));
// Event DTOs
class CreateEventDto {
    constructor() {
        this.status = EventStatus.SCHEDULED;
        this.visibility = EventVisibility.TEAM;
        this.allDay = false;
        this.allowRsvp = true;
        this.sendReminders = true;
    }
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(EventType),
    __metadata("design:type", String)
], CreateEventDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventStatus),
    __metadata("design:type", String)
], CreateEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventVisibility),
    __metadata("design:type", String)
], CreateEventDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "allDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateEventDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateEventDto.prototype, "onlineUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(7) // Hex color
    ,
    __metadata("design:type", String)
], CreateEventDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "createdBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateEventDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateEventDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "allowRsvp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEventDto.prototype, "sendReminders", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.Min)(0, { each: true }),
    (0, class_validator_1.Max)(10080, { each: true }) // Max 7 days
    ,
    __metadata("design:type", Array)
], CreateEventDto.prototype, "reminderMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateParticipantDto),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "participants", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "resourceIds", void 0);
class UpdateEventDto {
}
exports.UpdateEventDto = UpdateEventDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventType),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventStatus),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EventVisibility),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEventDto.prototype, "allDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "onlineUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(7),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "color", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateEventDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEventDto.prototype, "allowRsvp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], UpdateEventDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEventDto.prototype, "sendReminders", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.Min)(0, { each: true }),
    (0, class_validator_1.Max)(10080, { each: true }),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "reminderMinutes", void 0);
// Participant DTOs
class CreateParticipantDto {
    constructor() {
        this.status = ParticipantStatus.INVITED;
        this.isRequired = false;
    }
}
exports.CreateParticipantDto = CreateParticipantDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ParticipantStatus),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateParticipantDto.prototype, "isRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "notes", void 0);
class UpdateParticipantStatusDto {
}
exports.UpdateParticipantStatusDto = UpdateParticipantStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(ParticipantStatus),
    __metadata("design:type", String)
], UpdateParticipantStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateParticipantStatusDto.prototype, "responseMessage", void 0);
// Recurring Event DTOs
class CreateRecurringEventDto extends CreateEventDto {
}
exports.CreateRecurringEventDto = CreateRecurringEventDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RecurrenceRuleDto),
    __metadata("design:type", RecurrenceRuleDto)
], CreateRecurringEventDto.prototype, "recurrenceRule", void 0);
class RecurrenceRuleDto {
}
exports.RecurrenceRuleDto = RecurrenceRuleDto;
__decorate([
    (0, class_validator_1.IsEnum)(RecurrenceFrequency),
    __metadata("design:type", String)
], RecurrenceRuleDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], RecurrenceRuleDto.prototype, "interval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RecurrenceRuleDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], RecurrenceRuleDto.prototype, "count", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(0, { each: true }),
    (0, class_validator_1.Max)(6, { each: true }),
    __metadata("design:type", Array)
], RecurrenceRuleDto.prototype, "byWeekDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], RecurrenceRuleDto.prototype, "byMonthDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsDateString)({ each: true }),
    __metadata("design:type", Array)
], RecurrenceRuleDto.prototype, "exceptions", void 0);
// Conflict Check DTO
class CheckConflictsDto {
}
exports.CheckConflictsDto = CheckConflictsDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CheckConflictsDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CheckConflictsDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CheckConflictsDto.prototype, "participantIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CheckConflictsDto.prototype, "excludeEventId", void 0);
// Bulk Add Participants DTO
class BulkAddParticipantsDto {
}
exports.BulkAddParticipantsDto = BulkAddParticipantsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateParticipantDto),
    __metadata("design:type", Array)
], BulkAddParticipantsDto.prototype, "participants", void 0);
// Resource Enums
var ResourceType;
(function (ResourceType) {
    ResourceType["FACILITY"] = "facility";
    ResourceType["EQUIPMENT"] = "equipment";
    ResourceType["STAFF"] = "staff";
    ResourceType["VEHICLE"] = "vehicle";
    ResourceType["ROOM"] = "room";
    ResourceType["ICE_RINK"] = "ice_rink";
    ResourceType["GYM"] = "gym";
    ResourceType["FIELD"] = "field";
    ResourceType["OTHER"] = "other";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["AVAILABLE"] = "available";
    ResourceStatus["UNAVAILABLE"] = "unavailable";
    ResourceStatus["MAINTENANCE"] = "maintenance";
    ResourceStatus["RESERVED"] = "reserved";
    ResourceStatus["RETIRED"] = "retired";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
// Resource DTOs
class CreateResourceDto {
    constructor() {
        this.status = ResourceStatus.AVAILABLE;
        this.requiresApproval = false;
    }
}
exports.CreateResourceDto = CreateResourceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ResourceType),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ResourceStatus),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "building", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "roomNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], CreateResourceDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "maintenanceSchedule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "bookingRules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateResourceDto.prototype, "requiresApproval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateResourceDto.prototype, "approverIds", void 0);
class UpdateResourceDto {
}
exports.UpdateResourceDto = UpdateResourceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ResourceType),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ResourceStatus),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "building", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "roomNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], UpdateResourceDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateResourceDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateResourceDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateResourceDto.prototype, "maintenanceSchedule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateResourceDto.prototype, "bookingRules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateResourceDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateResourceDto.prototype, "requiresApproval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], UpdateResourceDto.prototype, "approverIds", void 0);
// Resource Availability Check DTO
class CheckResourceAvailabilityDto {
}
exports.CheckResourceAvailabilityDto = CheckResourceAvailabilityDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CheckResourceAvailabilityDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CheckResourceAvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CheckResourceAvailabilityDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CheckResourceAvailabilityDto.prototype, "excludeBookingId", void 0);
// Resource Booking DTOs
class CreateResourceBookingDto {
}
exports.CreateResourceBookingDto = CreateResourceBookingDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceBookingDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResourceBookingDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResourceBookingDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceBookingDto.prototype, "bookedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateResourceBookingDto.prototype, "purpose", void 0);
class ApproveBookingDto {
}
exports.ApproveBookingDto = ApproveBookingDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ApproveBookingDto.prototype, "approvedBy", void 0);
class CancelBookingDto {
}
exports.CancelBookingDto = CancelBookingDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "cancelledBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "reason", void 0);
//# sourceMappingURL=calendar.dto.js.map