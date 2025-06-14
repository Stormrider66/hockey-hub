import AppDataSource from '../data-source';
import { Permission, Role, RolePermission } from '../entities';

// Define same mapping as permissionService
const rolePermissionMap: Record<string, string[]> = {
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

export async function seedPermissions() {
  const dataSource = await AppDataSource.initialize();

  try {
    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const rolePermRepo = dataSource.getRepository(RolePermission);

    // Insert permissions
    const permissionNames = new Set<string>();
    Object.values(rolePermissionMap).forEach((perms: string[]) => perms.forEach((p: string) => permissionNames.add(p)));

    const existingPermissions = await permissionRepo.find();
    const existingNames = new Set(existingPermissions.map(p => p.name));

    const newPermissions: Permission[] = [];
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

    await permissionRepo.save(newPermissions);

    // Ensure roles exist
    const roles = await roleRepo.find();
    const rolesByName: Map<string, Role> = new Map<string, Role>(roles.map((r: Role) => [r.name, r]));

    for (const roleName of Object.keys(rolePermissionMap)) {
      if (!rolesByName.has(roleName)) {
        const role = roleRepo.create({ name: roleName });
        await roleRepo.save(role);
        rolesByName.set(roleName, role);
      }
    }

    // Create role-permission links
    const permissionsByName: Map<string, Permission> = new Map<string, Permission>((await permissionRepo.find()).map((p: Permission) => [p.name, p]));

    for (const [roleName, perms] of Object.entries(rolePermissionMap)) {
      const role = rolesByName.get(roleName)!;
      for (const permName of perms) {
        const permission = permissionsByName.get(permName)!;
        const exists = await rolePermRepo.findOne({ where: { role: { id: role.id }, permission: { id: permission.id } } });
        if (!exists) {
          const rp = rolePermRepo.create({ role, permission });
          await rolePermRepo.save(rp);
        }
      }
    }
    console.log('Seeded permissions and role mappings');
  } catch (err) {
    console.error('Seeding permissions failed', err);
    throw err;
  } finally {
    await dataSource.destroy();
  }
}

// If executed directly via ts-node
if (require.main === module) {
  seedPermissions().then(() => process.exit(0)).catch(() => process.exit(1));
} 