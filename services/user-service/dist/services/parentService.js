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
exports.ParentService = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const PlayerParentLink_1 = require("../entities/PlayerParentLink");
const serviceErrors_1 = require("../errors/serviceErrors");
const logger_1 = __importDefault(require("../config/logger"));
class ParentService {
    constructor() {
        this.linkRepository = (0, typeorm_1.getRepository)(PlayerParentLink_1.PlayerParentLink);
        this.userRepository = (0, typeorm_1.getRepository)(User_1.User);
    }
    addParentChildLink(data) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Attempting to link parent ${data.parentId} to child ${data.childId}`);
            // Validate parent and child exist and potentially have correct roles (e.g., child is a player)
            const [parent, child] = yield Promise.all([
                this.userRepository.findOne({ where: { id: data.parentId } }),
                this.userRepository.findOne({ where: { id: data.childId } })
            ]);
            if (!parent) {
                throw new serviceErrors_1.NotFoundError(`Parent user with ID ${data.parentId} not found`);
            }
            if (!child) {
                throw new serviceErrors_1.NotFoundError(`Child user with ID ${data.childId} not found`);
            }
            // Optional: Add checks for parent/child roles if needed
            // Check if link already exists
            const existingLink = yield this.linkRepository.findOne({
                where: { parentId: data.parentId, childId: data.childId }
            });
            if (existingLink) {
                throw new serviceErrors_1.ConflictError(`Link between parent ${data.parentId} and child ${data.childId} already exists`);
            }
            // Handle primary guardian logic (ensure only one primary per child)
            if (data.isPrimary) {
                yield this.linkRepository.update({ childId: data.childId, isPrimary: true }, { isPrimary: false });
            }
            const newLink = this.linkRepository.create({
                parentId: data.parentId,
                childId: data.childId,
                relationship: data.relationship || 'parent',
                isPrimary: data.isPrimary === undefined ? false : data.isPrimary,
            });
            const savedLink = yield this.linkRepository.save(newLink);
            logger_1.default.info(`Successfully linked parent ${data.parentId} to child ${data.childId} (Link ID: ${savedLink.id})`);
            return savedLink;
        });
    }
    removeParentChildLink(linkId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`Attempting to remove parent-child link ${linkId}`);
            const link = yield this.linkRepository.findOne({ where: { id: linkId } });
            if (!link) {
                throw new serviceErrors_1.NotFoundError(`Parent-child link with ID ${linkId} not found`);
            }
            yield this.linkRepository.remove(link);
            // Or soft delete if configured: await this.linkRepository.softRemove(link);
            logger_1.default.info(`Parent-child link ${linkId} removed successfully`);
        });
    }
    getChildrenForParent(parentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const links = yield this.linkRepository.find({
                where: { parentId },
                relations: ['child']
            });
            const childrenPromises = links.map((link) => __awaiter(this, void 0, void 0, function* () { return yield link.child; }));
            const children = yield Promise.all(childrenPromises);
            return children.filter((child) => !!child);
        });
    }
    getParentsForChild(childId) {
        return __awaiter(this, void 0, void 0, function* () {
            const links = yield this.linkRepository.find({
                where: { childId },
                relations: ['parent']
            });
            const parentPromises = links.map((link) => __awaiter(this, void 0, void 0, function* () { return yield link.parent; }));
            const parents = yield Promise.all(parentPromises);
            return parents.filter((parent) => !!parent);
        });
    }
    // Helper to check if a user is a parent/guardian of another user
    isParentOf(parentId, childId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.linkRepository.count({ where: { parentId, childId } });
            return count > 0;
        });
    }
}
exports.ParentService = ParentService;
//# sourceMappingURL=parentService.js.map