import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: UUID;

  @Column({ unique: true })
  name!: string;

  @Column({ default: 'active' })
  status!: 'active' | 'suspended' | 'deleted';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: ISODateString;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: ISODateString;
} 