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
exports.handleOrgProvisioned = exports.startOrgConsumer = void 0;
const eventBus_1 = require("../lib/eventBus");
const eventBus_2 = require("../lib/eventBus");
const typeorm_1 = require("typeorm");
const Role_1 = require("../entities/Role");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const startOrgConsumer = () => {
    (0, eventBus_1.subscribe)('organization.*', (msg) => {
        console.log('[User Service] organization event received', msg);
    });
    (0, eventBus_1.subscribe)('organization.provisioned', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[User Service] provisioning detected – bootstrapping admin for', msg.orgId);
        yield (0, exports.handleOrgProvisioned)(msg.orgId);
    }));
};
exports.startOrgConsumer = startOrgConsumer;
const handleOrgProvisioned = (orgId) => __awaiter(void 0, void 0, void 0, function* () {
    const roleRepo = (0, typeorm_1.getRepository)(Role_1.Role);
    const userRepo = (0, typeorm_1.getRepository)(User_1.User);
    // Ensure global 'admin' role exists
    let adminRole = yield roleRepo.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
        adminRole = roleRepo.create({ name: 'admin', description: 'Organization administrator' });
        adminRole = yield roleRepo.save(adminRole);
        console.log('[User Service] Default admin role created');
    }
    const adminEmail = `admin+${orgId}@example.com`;
    let adminUser = yield userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
        const passwordHash = yield bcryptjs_1.default.hash('ChangeMe123!', 10);
        adminUser = userRepo.create({
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            preferredLanguage: 'en',
            status: 'pending',
            organizationId: orgId,
            roles: [adminRole],
        });
        adminUser = yield userRepo.save(adminUser);
        console.log('[User Service] Skeleton admin user created:', adminEmail);
    }
    else {
        // Ensure user has admin role
        if (adminRole) {
            const adminRoleId = adminRole.id;
            const hasRole = (adminUser.roles || []).some((r) => r.id === adminRoleId);
            if (!hasRole) {
                adminUser.roles = [...(adminUser.roles || []), adminRole];
                yield userRepo.save(adminUser);
            }
        }
    }
    // Emit bootstrap complete event
    yield (0, eventBus_2.busPublish)('user.adminBootstrapComplete', { orgId, userId: adminUser.id });
    console.log('[User Service] user.adminBootstrapComplete emitted');
});
exports.handleOrgProvisioned = handleOrgProvisioned;
//# sourceMappingURL=orgEventConsumer.js.map