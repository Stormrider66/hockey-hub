import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './User';

@Entity('parent_child_relationships')
export class ParentChildRelationship {
  @PrimaryColumn('uuid')
  parentUserId: string;

  @PrimaryColumn('uuid')
  childUserId: string;

  @ManyToOne(() => User, user => user.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentUserId' })
  parent: User;

  @ManyToOne(() => User, user => user.parents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childUserId' })
  child: User;

  @Column({ type: 'varchar', length: 50, default: 'parent' })
  relationshipType: string;

  @Column({ type: 'boolean', default: false })
  isPrimaryContact: boolean;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}