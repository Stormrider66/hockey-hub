import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('service_api_keys')
@Index(['apiKey', 'isActive'])
export class ServiceApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  serviceName!: string;

  @Column({ unique: true })
  @Index()
  apiKey!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('simple-array')
  permissions!: string[];

  @Column('simple-array')
  allowedIps!: string[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  @Column({ default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  revokedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  revocationReason?: string;
}