"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.findById = exports.findAll = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const Event_1 = require("../entities/Event");
const EventResource_1 = require("../entities/EventResource");
const eventRepo = data_source_1.default.getRepository(Event_1.Event);
function findAll(filters) {
    return __awaiter(this, void 0, void 0, function* () {
        const qb = eventRepo.createQueryBuilder('e');
        if (filters.start) {
            qb.andWhere('e.endTime >= :start', { start: filters.start });
        }
        if (filters.end) {
            qb.andWhere('e.startTime <= :end', { end: filters.end });
        }
        if (filters.teamId) {
            qb.andWhere(':teamId = ANY(e.teamIds)', { teamId: filters.teamId });
        }
        if (filters.eventType) {
            qb.andWhere('e.eventType = :eventType', { eventType: filters.eventType });
        }
        if (filters.locationId) {
            qb.andWhere('e.locationId = :locationId', { locationId: filters.locationId });
        }
        qb.leftJoinAndSelect('e.eventResources', 'er');
        qb.leftJoinAndSelect('e.attendees', 'att');
        qb.orderBy('e.startTime', 'ASC');
        return qb.getMany();
    });
}
exports.findAll = findAll;
function findById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return eventRepo.findOne({ where: { id }, relations: ['eventResources', 'attendees'] });
    });
}
exports.findById = findById;
function createEvent(dto) {
    return __awaiter(this, void 0, void 0, function* () {
        return data_source_1.default.transaction((manager) => __awaiter(this, void 0, void 0, function* () {
            const ev = manager.create(Event_1.Event, dto);
            const saved = yield manager.save(ev);
            if (dto.resourceIds && dto.resourceIds.length > 0) {
                const ers = dto.resourceIds.map(rid => {
                    const er = new EventResource_1.EventResource();
                    er.eventId = saved.id;
                    er.resourceId = rid;
                    return er;
                });
                yield manager.save(ers);
                saved.eventResources = ers;
            }
            return saved;
        }));
    });
}
exports.createEvent = createEvent;
function updateEvent(id, dto) {
    return __awaiter(this, void 0, void 0, function* () {
        return data_source_1.default.transaction((manager) => __awaiter(this, void 0, void 0, function* () {
            const existing = yield manager.findOne(Event_1.Event, { where: { id }, relations: ['eventResources'] });
            if (!existing)
                return null;
            // update scalar fields
            Object.assign(existing, dto);
            const saved = yield manager.save(existing);
            if (dto.resourceIds) {
                // delete old links
                yield manager.delete(EventResource_1.EventResource, { eventId: id });
                if (dto.resourceIds.length > 0) {
                    const ers = dto.resourceIds.map(rid => {
                        const er = new EventResource_1.EventResource();
                        er.eventId = id;
                        er.resourceId = rid;
                        return er;
                    });
                    yield manager.save(ers);
                    saved.eventResources = ers;
                }
                else {
                    saved.eventResources = [];
                }
            }
            return saved;
        }));
    });
}
exports.updateEvent = updateEvent;
function deleteEvent(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield eventRepo.delete(id);
        return res.affected === 1;
    });
}
exports.deleteEvent = deleteEvent;
