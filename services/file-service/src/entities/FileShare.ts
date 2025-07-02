import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { File } from './File';

export enum ShareType {
  USER = 'user',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC_LINK = 'public_link',
}

export enum SharePermission {
  VIEW = 'view',
  DOWNLOAD = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
}

@Entity('file_shares')
@Unique(['fileId', 'sharedWithId', 'shareType'])
@Index(['shareToken'])
@Index(['expiresAt'])
export class FileShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileId: string;

  @ManyToOne(() => File, (file) => file.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  @Index()
  sharedById: string;

  @Column({ nullable: true })
  @Index()
  sharedWithId?: string;

  @Column({
    type: 'enum',
    enum: ShareType,
  })
  shareType: ShareType;

  @Column({
    type: 'simple-array',
    default: 'view,download',
  })
  permissions: SharePermission[];

  @Column({ nullable: true, unique: true })
  shareToken?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ default: 0 })
  maxAccessCount?: number;

  @Column({ default: 0 })
  accessCount: number;

  @Column({ nullable: true })
  lastAccessedAt?: Date;

  @Column({ nullable: true })
  lastAccessedBy?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  hasPermission(permission: SharePermission): boolean {
    return this.permissions.includes(permission);
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  hasReachedMaxAccess(): boolean {
    if (!this.maxAccessCount || this.maxAccessCount === 0) return false;
    return this.accessCount >= this.maxAccessCount;
  }

  canAccess(): boolean {
    return this.isActive && !this.isExpired() && !this.hasReachedMaxAccess();
  }
}