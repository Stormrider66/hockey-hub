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
import { User } from './user.entity';

export enum RelationshipType {
  PARENT = 'parent',
  GUARDIAN = 'guardian',
  OTHER = 'other',
}

@Entity({ name: 'player_parent_links' })
@Unique(['parentId', 'childId']) // Composite unique constraint
export class PlayerParentLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  parentId!: string;

  @Index()
  @Column({ type: 'uuid' })
  childId!: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    default: RelationshipType.PARENT,
  })
  relationship!: RelationshipType;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  // --- Relationships ---
  @ManyToOne(() => User, (user) => user.parentLinks)
  @JoinColumn({ name: 'parentId' })
  parent!: User;

  @ManyToOne(() => User, (user) => user.childLinks)
  @JoinColumn({ name: 'childId' })
  child!: User;
} 