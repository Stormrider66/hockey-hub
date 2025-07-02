import { Entity, Column, ManyToOne, Index, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';
import { Role } from './Role';

export enum OrganizationRole {
  PLAYER = 'player',
  COACH = 'coach',
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
  PARENT = 'parent',
  MEDICAL_STAFF = 'medical_staff',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

@Entity('user_organizations')
export class UserOrganization {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  organizationId: string;

  @ManyToOne(() => User, user => user.userOrganizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Index()
  user: User;

  @ManyToOne(() => Organization, org => org.userOrganizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  @Index()
  organization: Organization;

  @Column({ 
    type: 'enum',
    enum: OrganizationRole
  })
  @Index()
  role: OrganizationRole;

  @ManyToOne(() => Role, { nullable: true, eager: true })
  @JoinColumn({ name: 'roleId' })
  roleEntity?: Role;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Helper method to get permissions for this user in the organization
  getPermissions(): string[] {
    if (!this.roleEntity || !this.roleEntity.permissions) {
      return [];
    }
    return this.roleEntity.permissions
      .filter(p => p.isActive)
      .map(p => p.name);
  }
}