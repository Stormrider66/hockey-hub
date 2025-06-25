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
exports.EventResource = void 0;
const typeorm_1 = require("typeorm");
const Event_1 = require("./Event");
const Resource_1 = require("./Resource");
let EventResource = class EventResource {
};
exports.EventResource = EventResource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EventResource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EventResource.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EventResource.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Event_1.Event, event => event.eventResources, { onDelete: 'CASCADE' }) // Delete booking if event is deleted
    ,
    (0, typeorm_1.JoinColumn)({ name: 'eventId' }),
    __metadata("design:type", Event_1.Event)
], EventResource.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Resource_1.Resource, resource => resource.eventResources, { onDelete: 'CASCADE' }) // Delete booking if resource is deleted
    ,
    (0, typeorm_1.JoinColumn)({ name: 'resourceId' }),
    __metadata("design:type", Resource_1.Resource)
], EventResource.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", String)
], EventResource.prototype, "createdAt", void 0);
exports.EventResource = EventResource = __decorate([
    (0, typeorm_1.Entity)('event_resources'),
    (0, typeorm_1.Index)(['eventId', 'resourceId'], { unique: true }) // Ensure a resource isn't booked twice for the same event
], EventResource);
