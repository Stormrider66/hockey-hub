import { User } from './User';
import { Permission } from './Permission';
import { RolePermission } from './RolePermission';
export declare class Role {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    users: User[];
    permissions: Permission[];
    rolePermissions: RolePermission[];
}
//# sourceMappingURL=Role.d.ts.map