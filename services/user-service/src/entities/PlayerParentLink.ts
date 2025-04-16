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
import { User } from './User';

type RelationshipType = 'parent' | 'guardian' | 'other';

@Entity({ name: 'player_parent_links' })
@Index(['parentId'])
@Index(['childId'])
@Index(['isPrimary'])
@Unique(['parentId', 'childId']) // Can't link the same parent-child twice
export class PlayerParentLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  parentId!: string;

  @Column({ type: 'uuid' })
  childId!: string;

  @Column({
    type: 'enum',
    enum: ['parent', 'guardian', 'other'],
    default: 'parent'
  })
  relationship!: RelationshipType;

  @Column({ type: 'boolean', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  // --- Relationships ---
  @ManyToOne(() => User, (user) => user.childLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent!: User;

  @ManyToOne(() => User, (user) => user.parentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child!: User;
}