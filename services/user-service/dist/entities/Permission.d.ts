import { Role } from './Role';
import { RolePermission } from './RolePermission';
export declare class Permission {
    id: string;
    name: string;
    code: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    roles: Role[];
    rolePermissions: RolePermission[];
}
//# sourceMappingURL=Permission.d.ts.map