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
exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.findById = exports.findAll = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const Location_1 = require("../entities/Location");
const repo = data_source_1.default.getRepository(Location_1.Location);
function findAll(filters) {
    const qb = repo.createQueryBuilder('l');
    if (filters.organizationId)
        qb.where('l.organizationId = :org', { org: filters.organizationId });
    qb.orderBy('l.name', 'ASC');
    return qb.getMany();
}
exports.findAll = findAll;
function findById(id) {
    return repo.findOne({ where: { id } });
}
exports.findById = findById;
function createLocation(dto) {
    const location = repo.create(dto);
    return repo.save(location);
}
exports.createLocation = createLocation;
function updateLocation(id, dto) {
    return __awaiter(this, void 0, void 0, function* () {
        yield repo.update(id, dto);
        return findById(id);
    });
}
exports.updateLocation = updateLocation;
function deleteLocation(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield repo.delete(id);
        return res.affected === 1;
    });
}
exports.deleteLocation = deleteLocation;
