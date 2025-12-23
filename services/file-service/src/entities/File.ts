// @ts-nocheck - File entity with TypeORM decorators
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { FileShare } from './FileShare';
import { FileVersion } from './FileVersion';

export enum FileStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum FileCategory {
  PROFILE_PHOTO = 'profile_photo',
  MEDICAL_DOCUMENT = 'medical_document',
  TRAINING_VIDEO = 'training_video',
  GAME_VIDEO = 'game_video',
  TEAM_DOCUMENT = 'team_document',
  CONTRACT = 'contract',
  REPORT = 'report',
  OTHER = 'other',
}

@Entity('files')
@Index(['userId', 'status'])
@Index(['organizationId', 'category'])
@Index(['teamId', 'createdAt'])
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  @Index()
  organizationId?: string;

  @Column({ nullable: true })
  @Index()
  teamId?: string;

  @Column()
  originalName: string;

  @Column({ unique: true })
  @Index()
  storageKey: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  @Index()
  status: FileStatus;

  @Column({
    type: 'enum',
    enum: FileCategory,
    default: FileCategory.OTHER,
  })
  @Index()
  category: FileCategory;

  @Column({ nullable: true })
  description?: string;

  @Column('json', { nullable: true })
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    thumbnailKey?: string;
    previewKey?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  contentHash?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  virusScanStatus?: 'pending' | 'clean' | 'infected' | 'error';

  @Column({ nullable: true })
  virusScanDate?: Date;

  @Column({ nullable: true })
  virusScanResult?: string;

  @OneToMany(() => FileShare, (share) => share.file, { cascade: true })
  shares: FileShare[];

  @OneToMany(() => FileVersion, (version) => version.file, { cascade: true })
  versions: FileVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  deletedBy?: string;

  @Column({ nullable: true })
  lastAccessedAt?: Date;

  @Column({ default: 0 })
  accessCount: number;

  // Virtual properties
  get url(): string {
    return `/api/files/${this.id}`;
  }

  get downloadUrl(): string {
    return `/api/files/${this.id}/download`;
  }

  get thumbnailUrl(): string | null {
    if (this.metadata?.thumbnailKey) {
      return `/api/files/${this.id}/thumbnail`;
    }
    return null;
  }

  get previewUrl(): string | null {
    if (this.metadata?.previewKey) {
      return `/api/files/${this.id}/preview`;
    }
    return null;
  }

  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  get isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  get isDocument(): boolean {
    return (
      this.mimeType.includes('pdf') ||
      this.mimeType.includes('document') ||
      this.mimeType.includes('spreadsheet') ||
      this.mimeType.includes('presentation')
    );
  }
}