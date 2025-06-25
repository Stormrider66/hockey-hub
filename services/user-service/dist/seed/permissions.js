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
exports.seedPermissions = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const entities_1 = require("../entities");
// Define same mapping as permissionService
const rolePermissionMap = {
    admin: ['*:*'],
    club_admin: [
        'organization:read', 'organization:update',
        'team:*',
        'user:*',
        'event:*',
        'resource:*',
        'chat:*',
        'subscription:read', 'subscription:update',
        'invoice:read',
        'payment-method:*',
        'role:read',
        'language:read',
        'translation:read',
        'metrics:read:usage',
        'planning:*',
        'medical:*',
        'training:*',
        'statistics:*',
    ],
    coach: [
        'team:read', 'team:update',
        'user:read',
        'event:*',
        'training:*',
        'game:*',
        'statistics:read',
        'player-goal:*',
        'team-goal:*',
        'chat:*',
        'notification:*',
        'injury:read', 'injury:create',
        'player-status:read',
        'test:*',
        'test-result:*',
        'exercise:read', 'exercise:create',
        'planning:read',
        'development-plan:*',
        'role:read',
        'language:read',
        'translation:read',
    ],
};
function seedPermissions() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataSource = yield data_source_1.default.initialize();
        try {
            const permissionRepo = dataSource.getRepository(entities_1.Permission);
            const roleRepo = dataSource.getRepository(entities_1.Role);
            const rolePermRepo = dataSource.getRepository(entities_1.RolePermission);
            // Insert permissions
            const permissionNames = new Set();
            Object.values(rolePermissionMap).forEach((perms) => perms.forEach((p) => permissionNames.add(p)));
            const existingPermissions = yield permissionRepo.find();
            const existingNames = new Set(existingPermissions.map(p => p.name));
            const newPermissions = [];
            permissionNames.forEach(name => {
                if (!existingNames.has(name)) {
                    // Create permission instance with proper name and generate a description
                    const description = `Permission to ${name.split(':')[1] || 'access'} ${name.split(':')[0]}`;
                    newPermissions.push(permissionRepo.create({
                        name,
                        description: name === '*:*' ? 'Full system access' : description
                    }));
                }
            });
            yield permissionRepo.save(newPermissions);
            // Ensure roles exist
            const roles = yield roleRepo.find();
            const rolesByName = new Map(roles.map((r) => [r.name, r]));
            for (const roleName of Object.keys(rolePermissionMap)) {
                if (!rolesByName.has(roleName)) {
                    const role = roleRepo.create({ name: roleName });
                    yield roleRepo.save(role);
                    rolesByName.set(roleName, role);
                }
            }
            // Create role-permission links
            const permissionsByName = new Map((yield permissionRepo.find()).map((p) => [p.name, p]));
            for (const [roleName, perms] of Object.entries(rolePermissionMap)) {
                const role = rolesByName.get(roleName);
                for (const permName of perms) {
                    const permission = permissionsByName.get(permName);
                    const exists = yield rolePermRepo.findOne({ where: { role: { id: role.id }, permission: { id: permission.id } } });
                    if (!exists) {
                        const rp = rolePermRepo.create({ role, permission });
                        yield rolePermRepo.save(rp);
                    }
                }
            }
            console.log('Seeded permissions and role mappings');
        }
        catch (err) {
            console.error('Seeding permissions failed', err);
            throw err;
        }
        finally {
            yield dataSource.destroy();
        }
    });
}
exports.seedPermissions = seedPermissions;
// If executed directly via ts-node
if (require.main === module) {
    seedPermissions().then(() => process.exit(0)).catch(() => process.exit(1));
}
//# sourceMappingURL=permissions.js.map