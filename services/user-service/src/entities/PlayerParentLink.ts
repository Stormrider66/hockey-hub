import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check
} from 'typeorm';
import { User } from './User';

export type RelationshipType = 'parent' | 'guardian' | 'other';

@Entity('player_parent_links')
@Index(['parentId'])
@Index(['childId'])
@Index(['isPrimary'])
@Index(['parentId', 'childId'], { unique: true }) // Composite unique index
@Check(`"relationship" IN ('parent', 'guardian', 'other')`)
export class PlayerParentLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'parent_id', type: 'uuid' })
  parentId!: string;

  @ManyToOne(() => User, (user) => user.parentLinks, { nullable: false, lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent!: Promise<User>;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @ManyToOne(() => User, (user) => user.childLinks, { nullable: false, lazy: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child!: Promise<User>;

  @Column({ type: 'enum', enum: ['parent', 'guardian', 'other'], default: 'parent' })
  relationship!: RelationshipType;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}