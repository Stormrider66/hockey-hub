import { DataSource } from 'typeorm';
import { Permission, PERMISSIONS } from '../entities/Permission';
import { Role, SYSTEM_ROLES } from '../entities/Role';

export class RBACSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
    await this.assignPermissionsToRoles();
  }

  private async seedPermissions(): Promise<void> {
    const permissionRepo = this.dataSource.getRepository(Permission);
    
    const permissionsData = [
      // User management
      { name: PERMISSIONS.USERS_CREATE, description: 'Create new users', resource: 'users', action: 'create' },
      { name: PERMISSIONS.USERS_READ, description: 'View user details', resource: 'users', action: 'read' },
      { name: PERMISSIONS.USERS_UPDATE, description: 'Update user information', resource: 'users', action: 'update' },
      { name: PERMISSIONS.USERS_DELETE, description: 'Delete users', resource: 'users', action: 'delete' },
      { name: PERMISSIONS.USERS_LIST, description: 'List all users', resource: 'users', action: 'list' },
      
      // Team management
      { name: PERMISSIONS.TEAMS_CREATE, description: 'Create new teams', resource: 'teams', action: 'create' },
      { name: PERMISSIONS.TEAMS_READ, description: 'View team details', resource: 'teams', action: 'read' },
      { name: PERMISSIONS.TEAMS_UPDATE, description: 'Update team information', resource: 'teams', action: 'update' },
      { name: PERMISSIONS.TEAMS_DELETE, description: 'Delete teams', resource: 'teams', action: 'delete' },
      { name: PERMISSIONS.TEAMS_LIST, description: 'List all teams', resource: 'teams', action: 'list' },
      { name: PERMISSIONS.TEAMS_MANAGE_MEMBERS, description: 'Manage team members', resource: 'teams', action: 'manage_members' },
      
      // Organization management
      { name: PERMISSIONS.ORGANIZATIONS_CREATE, description: 'Create new organizations', resource: 'organizations', action: 'create' },
      { name: PERMISSIONS.ORGANIZATIONS_READ, description: 'View organization details', resource: 'organizations', action: 'read' },
      { name: PERMISSIONS.ORGANIZATIONS_UPDATE, description: 'Update organization information', resource: 'organizations', action: 'update' },
      { name: PERMISSIONS.ORGANIZATIONS_DELETE, description: 'Delete organizations', resource: 'organizations', action: 'delete' },
      { name: PERMISSIONS.ORGANIZATIONS_LIST, description: 'List all organizations', resource: 'organizations', action: 'list' },
      
      // Training management
      { name: PERMISSIONS.TRAINING_CREATE, description: 'Create training sessions', resource: 'training', action: 'create' },
      { name: PERMISSIONS.TRAINING_READ, description: 'View training sessions', resource: 'training', action: 'read' },
      { name: PERMISSIONS.TRAINING_UPDATE, description: 'Update training sessions', resource: 'training', action: 'update' },
      { name: PERMISSIONS.TRAINING_DELETE, description: 'Delete training sessions', resource: 'training', action: 'delete' },
      { name: PERMISSIONS.TRAINING_LIST, description: 'List all training sessions', resource: 'training', action: 'list' },
      { name: PERMISSIONS.TRAINING_EXECUTE, description: 'Execute training sessions', resource: 'training', action: 'execute' },
      
      // Medical records
      { name: PERMISSIONS.MEDICAL_CREATE, description: 'Create medical records', resource: 'medical', action: 'create' },
      { name: PERMISSIONS.MEDICAL_READ, description: 'View medical records', resource: 'medical', action: 'read' },
      { name: PERMISSIONS.MEDICAL_UPDATE, description: 'Update medical records', resource: 'medical', action: 'update' },
      { name: PERMISSIONS.MEDICAL_DELETE, description: 'Delete medical records', resource: 'medical', action: 'delete' },
      { name: PERMISSIONS.MEDICAL_LIST, description: 'List all medical records', resource: 'medical', action: 'list' },
      
      // Calendar management
      { name: PERMISSIONS.CALENDAR_CREATE, description: 'Create calendar events', resource: 'calendar', action: 'create' },
      { name: PERMISSIONS.CALENDAR_READ, description: 'View calendar events', resource: 'calendar', action: 'read' },
      { name: PERMISSIONS.CALENDAR_UPDATE, description: 'Update calendar events', resource: 'calendar', action: 'update' },
      { name: PERMISSIONS.CALENDAR_DELETE, description: 'Delete calendar events', resource: 'calendar', action: 'delete' },
      { name: PERMISSIONS.CALENDAR_LIST, description: 'List all calendar events', resource: 'calendar', action: 'list' },
      
      // Statistics
      { name: PERMISSIONS.STATISTICS_READ, description: 'View statistics', resource: 'statistics', action: 'read' },
      { name: PERMISSIONS.STATISTICS_EXPORT, description: 'Export statistics', resource: 'statistics', action: 'export' },
      
      // Payments
      { name: PERMISSIONS.PAYMENTS_CREATE, description: 'Create payments', resource: 'payments', action: 'create' },
      { name: PERMISSIONS.PAYMENTS_READ, description: 'View payments', resource: 'payments', action: 'read' },
      { name: PERMISSIONS.PAYMENTS_UPDATE, description: 'Update payments', resource: 'payments', action: 'update' },
      { name: PERMISSIONS.PAYMENTS_LIST, description: 'List all payments', resource: 'payments', action: 'list' },
      { name: PERMISSIONS.PAYMENTS_REFUND, description: 'Process refunds', resource: 'payments', action: 'refund' },
      
      // Communication
      { name: PERMISSIONS.MESSAGES_SEND, description: 'Send messages', resource: 'messages', action: 'send' },
      { name: PERMISSIONS.MESSAGES_READ, description: 'Read messages', resource: 'messages', action: 'read' },
      { name: PERMISSIONS.MESSAGES_BROADCAST, description: 'Send broadcast messages', resource: 'messages', action: 'broadcast' },
      
      // Admin
      { name: PERMISSIONS.ADMIN_ACCESS, description: 'Access admin panel', resource: 'admin', action: 'access' },
      { name: PERMISSIONS.ADMIN_USERS, description: 'Manage users in admin panel', resource: 'admin', action: 'users' },
      { name: PERMISSIONS.ADMIN_SYSTEM, description: 'Manage system settings', resource: 'admin', action: 'system' },
      { name: PERMISSIONS.ADMIN_AUDIT, description: 'View audit logs', resource: 'admin', action: 'audit' },
    ];

    for (const permData of permissionsData) {
      const existing = await permissionRepo.findOne({ where: { name: permData.name } });
      if (!existing) {
        await permissionRepo.save(permissionRepo.create(permData));
      }
    }
  }

  private async seedRoles(): Promise<void> {
    const roleRepo = this.dataSource.getRepository(Role);
    
    const rolesData = [
      { name: SYSTEM_ROLES.SUPER_ADMIN, displayName: 'Super Administrator', description: 'Full system access', isSystem: true },
      { name: SYSTEM_ROLES.ADMIN, displayName: 'Administrator', description: 'Organization-wide admin access', isSystem: true },
      { name: SYSTEM_ROLES.CLUB_ADMIN, displayName: 'Club Administrator', description: 'Club management access', isSystem: true },
      { name: SYSTEM_ROLES.COACH, displayName: 'Coach', description: 'Team coaching access', isSystem: true },
      { name: SYSTEM_ROLES.ASSISTANT_COACH, displayName: 'Assistant Coach', description: 'Assistant coaching access', isSystem: true },
      { name: SYSTEM_ROLES.PLAYER, displayName: 'Player', description: 'Player access', isSystem: true },
      { name: SYSTEM_ROLES.PARENT, displayName: 'Parent', description: 'Parent/Guardian access', isSystem: true },
      { name: SYSTEM_ROLES.MEDICAL_STAFF, displayName: 'Medical Staff', description: 'Medical team access', isSystem: true },
      { name: SYSTEM_ROLES.EQUIPMENT_MANAGER, displayName: 'Equipment Manager', description: 'Equipment management access', isSystem: true },
      { name: SYSTEM_ROLES.PHYSICAL_TRAINER, displayName: 'Physical Trainer', description: 'Physical training access', isSystem: true },
      { name: SYSTEM_ROLES.TEAM_MANAGER, displayName: 'Team Manager', description: 'Team management access', isSystem: true },
    ];

    for (const roleData of rolesData) {
      const existing = await roleRepo.findOne({ where: { name: roleData.name } });
      if (!existing) {
        await roleRepo.save(roleRepo.create(roleData));
      }
    }
  }

  private async assignPermissionsToRoles(): Promise<void> {
    const roleRepo = this.dataSource.getRepository(Role);
    const permissionRepo = this.dataSource.getRepository(Permission);

    // Define role-permission mappings
    const rolePermissions: Record<string, string[]> = {
      [SYSTEM_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
      
      [SYSTEM_ROLES.ADMIN]: [
        // All permissions except system admin
        ...Object.values(PERMISSIONS).filter(p => !p.startsWith('admin.system'))
      ],
      
      [SYSTEM_ROLES.CLUB_ADMIN]: [
        PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_CREATE, PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_UPDATE, PERMISSIONS.TEAMS_LIST, PERMISSIONS.TEAMS_MANAGE_MEMBERS,
        PERMISSIONS.ORGANIZATIONS_READ, PERMISSIONS.ORGANIZATIONS_UPDATE,
        PERMISSIONS.TRAINING_CREATE, PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_UPDATE, PERMISSIONS.TRAINING_LIST,
        PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_UPDATE, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.STATISTICS_READ, PERMISSIONS.STATISTICS_EXPORT,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ, PERMISSIONS.MESSAGES_BROADCAST,
        PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_USERS,
      ],
      
      [SYSTEM_ROLES.COACH]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_UPDATE, PERMISSIONS.TEAMS_LIST, PERMISSIONS.TEAMS_MANAGE_MEMBERS,
        PERMISSIONS.TRAINING_CREATE, PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_UPDATE, PERMISSIONS.TRAINING_LIST, PERMISSIONS.TRAINING_EXECUTE,
        PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_UPDATE, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.STATISTICS_READ, PERMISSIONS.STATISTICS_EXPORT,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.ASSISTANT_COACH]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_LIST, PERMISSIONS.TRAINING_EXECUTE,
        PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.STATISTICS_READ,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.PLAYER]: [
        PERMISSIONS.USERS_READ, // Own profile
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_LIST,
        PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.STATISTICS_READ, // Own statistics
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.PARENT]: [
        PERMISSIONS.USERS_READ, // Own and children's profiles
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_LIST,
        PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.MEDICAL_READ, // Children's medical records
        PERMISSIONS.STATISTICS_READ, // Children's statistics
        PERMISSIONS.PAYMENTS_CREATE, PERMISSIONS.PAYMENTS_READ, PERMISSIONS.PAYMENTS_LIST,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.MEDICAL_STAFF]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.MEDICAL_CREATE, PERMISSIONS.MEDICAL_READ, PERMISSIONS.MEDICAL_UPDATE, PERMISSIONS.MEDICAL_LIST,
        PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.PHYSICAL_TRAINER]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.TRAINING_CREATE, PERMISSIONS.TRAINING_READ, PERMISSIONS.TRAINING_UPDATE, PERMISSIONS.TRAINING_LIST, PERMISSIONS.TRAINING_EXECUTE,
        PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_UPDATE, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.STATISTICS_READ,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.EQUIPMENT_MANAGER]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ,
      ],
      
      [SYSTEM_ROLES.TEAM_MANAGER]: [
        PERMISSIONS.USERS_READ, PERMISSIONS.USERS_LIST,
        PERMISSIONS.TEAMS_READ, PERMISSIONS.TEAMS_UPDATE, PERMISSIONS.TEAMS_LIST,
        PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.CALENDAR_READ, PERMISSIONS.CALENDAR_UPDATE, PERMISSIONS.CALENDAR_LIST,
        PERMISSIONS.MESSAGES_SEND, PERMISSIONS.MESSAGES_READ, PERMISSIONS.MESSAGES_BROADCAST,
      ],
    };

    // Assign permissions to each role
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      const role = await roleRepo.findOne({ where: { name: roleName } });
      if (!role) continue;

      const permissions = await permissionRepo.find({
        where: permissionNames.map(name => ({ name }))
      });

      role.permissions = permissions;
      await roleRepo.save(role);
    }
  }
}