import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';

export enum ConfigScope {
  SYSTEM = 'system',
  ORGANIZATION = 'organization',
  TEAM = 'team',
  USER = 'user'
}

export enum ConfigType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ENCRYPTED = 'encrypted'
}

@Entity('system_configurations')
@Index(['key', 'scope', 'scopeId'], { unique: true })
@Index(['category', 'isActive'])
@Index(['scopeId', 'scope'])
export class SystemConfiguration extends BaseEntity {

  @Column()
  @Index()
  key: string;

  @Column('text')
  value: string;

  @Column({
    type: 'enum',
    enum: ConfigType
  })
  type: ConfigType;

  @Column({
    type: 'enum',
    enum: ConfigScope,
    default: ConfigScope.SYSTEM
  })
  scope: ConfigScope;

  @Column('uuid', { nullable: true })
  scopeId?: string; // organizationId, teamId, or userId depending on scope

  @Column()
  category: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean; // Whether this config is visible to non-admins

  @Column({ default: false })
  isReadOnly: boolean; // System configs that can't be modified

  @Column('jsonb', { nullable: true })
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: any[];
    required?: boolean;
  };

  @Column('jsonb', { nullable: true })
  defaultValue?: any;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getValue(): any {
    switch (this.type) {
      case ConfigType.NUMBER:
        return parseFloat(this.value);
      case ConfigType.BOOLEAN:
        return this.value === 'true';
      case ConfigType.JSON:
        return JSON.parse(this.value);
      case ConfigType.ENCRYPTED:
        // Should be decrypted by service layer
        return this.value;
      default:
        return this.value;
    }
  }

  setValue(value: any): void {
    switch (this.type) {
      case ConfigType.NUMBER:
        this.value = String(value);
        break;
      case ConfigType.BOOLEAN:
        this.value = String(!!value);
        break;
      case ConfigType.JSON:
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = String(value);
    }
  }

  isValid(value: any): boolean {
    if (!this.validation) return true;

    if (this.validation.required && (value === null || value === undefined)) {
      return false;
    }

    if (this.type === ConfigType.NUMBER && typeof value === 'number') {
      if (this.validation.min !== undefined && value < this.validation.min) return false;
      if (this.validation.max !== undefined && value > this.validation.max) return false;
    }

    if (this.type === ConfigType.STRING && typeof value === 'string') {
      if (this.validation.pattern) {
        const regex = new RegExp(this.validation.pattern);
        if (!regex.test(value)) return false;
      }
    }

    if (this.validation.allowedValues && !this.validation.allowedValues.includes(value)) {
      return false;
    }

    return true;
  }
}