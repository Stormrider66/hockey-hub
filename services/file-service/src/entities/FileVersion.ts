import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { File } from './File';

@Entity('file_versions')
@Index(['fileId', 'versionNumber'])
@Index(['createdAt'])
export class FileVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileId: string;

  @ManyToOne(() => File, (file) => file.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  versionNumber: number;

  @Column()
  storageKey: string;

  @Column('bigint')
  size: number;

  @Column({ nullable: true })
  contentHash?: string;

  @Column()
  uploadedBy: string;

  @Column({ nullable: true })
  comment?: string;

  @Column('json', { nullable: true })
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    [key: string]: any;
  };

  @Column({ default: false })
  isCurrent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  restoredAt?: Date;

  @Column({ nullable: true })
  restoredBy?: string;
}