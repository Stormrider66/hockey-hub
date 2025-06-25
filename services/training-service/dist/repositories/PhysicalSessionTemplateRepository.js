"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.physicalSessionTemplateRepository = exports.PhysicalSessionTemplateRepository = void 0;
// Placeholder for PhysicalSessionTemplate repository
const typeorm_1 = require("typeorm");
const data_source_1 = require("../data-source");
const PhysicalSessionTemplate_1 = require("../entities/PhysicalSessionTemplate");
let PhysicalSessionTemplateRepository = class PhysicalSessionTemplateRepository extends typeorm_1.Repository {
    findTemplates(filters, limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.createQueryBuilder('template')
                .where('1=1');
            if (filters.organizationId) {
                query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                    orgId: filters.organizationId
                });
            }
            else {
                query.andWhere('template.is_public = true');
            }
            if (filters.categoryId) {
                query.andWhere('template.categoryId = :categoryId', { categoryId: filters.categoryId });
            }
            if (filters.searchTerm) {
                query.andWhere('(template.name ILIKE :search OR template.description ILIKE :search)', { search: `%${filters.searchTerm}%` });
            }
            return query
                .orderBy('template.created_at', 'DESC')
                .take(limit)
                .skip(offset)
                .getMany();
        });
    }
    countTemplates(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.createQueryBuilder('template')
                .where('1=1');
            if (filters.organizationId) {
                query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                    orgId: filters.organizationId
                });
            }
            else {
                query.andWhere('template.is_public = true');
            }
            if (filters.categoryId) {
                query.andWhere('template.categoryId = :categoryId', { categoryId: filters.categoryId });
            }
            if (filters.searchTerm) {
                query.andWhere('(template.name ILIKE :search OR template.description ILIKE :search)', { search: `%${filters.searchTerm}%` });
            }
            return query.getCount();
        });
    }
    findTemplateById(id, organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.createQueryBuilder('template')
                .where('template.id = :id', { id });
            if (organizationId) {
                query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                    orgId: organizationId
                });
            }
            else {
                query.andWhere('template.is_public = true');
            }
            return query.getOne();
        });
    }
    createTemplate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = this.create(data);
            return this.save(template);
        });
    }
    updateTemplate(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.update(id, data);
            if (result.affected === 0) {
                return null;
            }
            return this.findOneBy({ id });
        });
    }
    deleteTemplate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.softDelete(id);
            return result.affected === 1;
        });
    }
};
exports.PhysicalSessionTemplateRepository = PhysicalSessionTemplateRepository;
exports.PhysicalSessionTemplateRepository = PhysicalSessionTemplateRepository = __decorate([
    (0, typeorm_1.EntityRepository)(PhysicalSessionTemplate_1.PhysicalSessionTemplate)
], PhysicalSessionTemplateRepository);
// Export the repository instance
exports.physicalSessionTemplateRepository = data_source_1.AppDataSource.getCustomRepository(PhysicalSessionTemplateRepository);
