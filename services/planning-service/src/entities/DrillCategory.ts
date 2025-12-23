import { Entity, Column, Tree, TreeChildren, TreeParent, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

@Entity('drill_categories')
@Tree('closure-table')
@Index(['name', 'organizationId'], { unique: true })
export class DrillCategory extends AuditableEntity {

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid', nullable: true })
  @Index()
  organizationId?: string;

  @Column({ default: false })
  isSystem: boolean; // System-wide categories vs organization-specific

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @TreeChildren()
  children: DrillCategory[];

  @TreeParent()
  parent: DrillCategory;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getFullPath(): string {
    // This would be implemented with proper tree traversal
    return this.name;
  }
}