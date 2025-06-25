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
exports.removeAttendee = exports.addAttendee = exports.findByEvent = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const EventAttendee_1 = require("../entities/EventAttendee");
const repo = data_source_1.default.getRepository(EventAttendee_1.EventAttendee);
function findByEvent(eventId) {
    return repo.find({ where: { eventId } });
}
exports.findByEvent = findByEvent;
function addAttendee(dto) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const attendee = repo.create({
            eventId: dto.eventId,
            userId: dto.userId,
            status: dto.status,
            reasonForAbsence: (_a = dto.reasonForAbsence) !== null && _a !== void 0 ? _a : null,
        });
        return repo.save(attendee);
    });
}
exports.addAttendee = addAttendee;
function removeAttendee(eventId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield repo.delete({ eventId, userId });
        return res.affected === 1;
    });
}
exports.removeAttendee = removeAttendee;
