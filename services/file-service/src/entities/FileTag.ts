import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('file_tags')
@Unique(['fileId', 'tag'])
@Index(['tag'])
@Index(['fileId'])
export class FileTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileId: string;

  @Column()
  tag: string;

  @Column()
  addedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}