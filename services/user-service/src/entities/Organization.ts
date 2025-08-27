import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib/entities';
import { Team } from './Team';
import { UserOrganization } from './UserOrganization';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  subdomain: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'free' 
  })
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';

  @Column({ type: 'timestamp with time zone', nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => Team, team => team.organization)
  teams: Team[];

  @OneToMany(() => UserOrganization, userOrg => userOrg.organization)
  userOrganizations: UserOrganization[];
}