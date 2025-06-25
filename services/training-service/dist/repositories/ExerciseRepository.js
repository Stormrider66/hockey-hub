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
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseRepository = exports.deleteExercise = exports.updateExercise = exports.createExercise = exports.findExerciseById = exports.countExercises = exports.findExercises = void 0;
// @ts-nocheck
const data_source_1 = require("../data-source");
const Exercise_1 = require("../entities/Exercise");
const baseRepo = data_source_1.AppDataSource.getRepository(Exercise_1.Exercise);
const findExercises = (filters, limit = 20, offset = 0) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = baseRepo.createQueryBuilder('ex');
    if (filters.organizationId) {
        qb.andWhere('(ex.organizationId = :orgId OR ex.is_public = true)', { orgId: filters.organizationId });
    }
    if (filters.category) {
        qb.andWhere('ex.category = :cat', { cat: filters.category });
    }
    if (filters.searchTerm) {
        qb.andWhere('LOWER(ex.name) LIKE LOWER(:search)', { search: `%${filters.searchTerm}%` });
    }
    qb.skip(offset).take(limit).orderBy('ex.createdAt', 'DESC');
    return qb.getMany();
});
exports.findExercises = findExercises;
const countExercises = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = baseRepo.createQueryBuilder('ex').select('COUNT(ex.id)', 'cnt');
    if (filters.organizationId) {
        qb.andWhere('(ex.organizationId = :orgId OR ex.is_public = true)', { orgId: filters.organizationId });
    }
    if (filters.category) {
        qb.andWhere('ex.category = :cat', { cat: filters.category });
    }
    if (filters.searchTerm) {
        qb.andWhere('LOWER(ex.name) LIKE LOWER(:search)', { search: `%${filters.searchTerm}%` });
    }
    const result = yield qb.getRawOne();
    return parseInt((result === null || result === void 0 ? void 0 : result.cnt) || '0', 10);
});
exports.countExercises = countExercises;
const findExerciseById = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (organizationId) {
        // @ts-ignore
        return baseRepo.findOne({ where: [{ id: id, organizationId }, { id: id, is_public: true }] });
    }
    // @ts-ignore
    return baseRepo.findOne({ where: { id: id } });
});
exports.findExerciseById = findExerciseById;
const createExercise = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const ex = baseRepo.create(data);
    return baseRepo.save(ex);
});
exports.createExercise = createExercise;
const updateExercise = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    yield baseRepo.update(id, updates);
    return baseRepo.findOne({ where: { id } });
});
exports.updateExercise = updateExercise;
const deleteExercise = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield baseRepo.delete(id);
    return res.affected === 1;
});
exports.deleteExercise = deleteExercise;
exports.exerciseRepository = Object.assign(Object.assign({}, baseRepo), { findExercises: exports.findExercises,
    countExercises: exports.countExercises,
    findExerciseById: exports.findExerciseById,
    createExercise: exports.createExercise,
    updateExercise: exports.updateExercise,
    deleteExercise: exports.deleteExercise });
