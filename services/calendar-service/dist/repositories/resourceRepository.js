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
exports.deleteResource = exports.updateResource = exports.createResource = exports.findById = exports.findAll = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const Resource_1 = require("../entities/Resource");
const repo = data_source_1.default.getRepository(Resource_1.Resource);
function findAll(filters) {
    const qb = repo.createQueryBuilder('r');
    if (filters.organizationId)
        qb.andWhere('r.organizationId = :org', { org: filters.organizationId });
    if (filters.locationId)
        qb.andWhere('r.locationId = :loc', { loc: filters.locationId });
    if (filters.resourceTypeId)
        qb.andWhere('r.resourceTypeId = :rt', { rt: filters.resourceTypeId });
    qb.andWhere('r.isBookable = true');
    qb.orderBy('r.name', 'ASC');
    return qb.getMany();
}
exports.findAll = findAll;
function findById(id) {
    return repo.findOne({ where: { id } });
}
exports.findById = findById;
function createResource(dto) {
    const res = repo.create(dto);
    return repo.save(res);
}
exports.createResource = createResource;
function updateResource(id, dto) {
    return __awaiter(this, void 0, void 0, function* () {
        yield repo.update(id, dto);
        return findById(id);
    });
}
exports.updateResource = updateResource;
function deleteResource(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield repo.delete(id);
        return res.affected === 1;
    });
}
exports.deleteResource = deleteResource;
