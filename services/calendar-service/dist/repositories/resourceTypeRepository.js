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
exports.deleteResourceType = exports.updateResourceType = exports.createResourceType = exports.findById = exports.findAll = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const ResourceType_1 = require("../entities/ResourceType");
const repo = data_source_1.default.getRepository(ResourceType_1.ResourceType);
function findAll(filters) {
    const qb = repo.createQueryBuilder('rt');
    if (filters.organizationId)
        qb.where('rt.organizationId = :org', { org: filters.organizationId });
    qb.orderBy('rt.name', 'ASC');
    return qb.getMany();
}
exports.findAll = findAll;
function findById(id) {
    return repo.findOne({ where: { id } });
}
exports.findById = findById;
function createResourceType(dto) {
    const entity = repo.create(dto);
    return repo.save(entity);
}
exports.createResourceType = createResourceType;
function updateResourceType(id, dto) {
    return __awaiter(this, void 0, void 0, function* () {
        yield repo.update(id, dto);
        return findById(id);
    });
}
exports.updateResourceType = updateResourceType;
function deleteResourceType(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield repo.delete(id);
        return res.affected === 1;
    });
}
exports.deleteResourceType = deleteResourceType;
