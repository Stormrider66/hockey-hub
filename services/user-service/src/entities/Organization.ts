import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Team } from './Team';
import { User } from './User';

type OrganizationStatus = 'active' | 'inactive' | 'trial';

@Entity({ name: 'organizations' })
@Index(['name'])
@Index(['status'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  contactEmail!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, default: 'Sweden' })
  country!: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string; // Hex code

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor?: string; // Hex code

  @Column({ type: 'varchar', length: 10, default: 'sv' })
  defaultLanguage!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'trial'],
    default: 'active'
  })
  status!: OrganizationStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // --- Relationships ---
  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Team, (team) => team.organization)
  teams!: Team[];

  // Note: Relationships to other services (e.g., Subscriptions) are managed conceptually
  // or via IDs, not direct TypeORM relations across service boundaries.
}