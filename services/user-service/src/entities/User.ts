import { Entity, Column, OneToMany, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { 
  IsEmail, 
  IsString, 
  Length, 
  IsOptional, 
  IsBoolean,
  IsEnum,
  IsDateString,
  IsUrl
} from 'class-validator';
import { UserOrganization } from './UserOrganization';
import { TeamMember } from './TeamMember';
import { ParentChildRelationship } from './ParentChildRelationship';
import { IsEmailUnique, IsValidAgeForRole } from './validators/UserValidator';

export enum Handedness {
  LEFT = 'left',
  RIGHT = 'right',
  AMBIDEXTROUS = 'ambidextrous'
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsEmailUnique({ message: 'Email already exists' })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(2, 100, { message: 'First name must be between 2 and 100 characters' })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(2, 100, { message: 'Last name must be between 2 and 100 characters' })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  @Length(10, 20, { message: 'Phone number must be between 10 and 20 characters' })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsValidAgeForRole()
  dateOfBirth?: Date;

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  jerseyNumber?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  position?: string;

  @Column({ 
    type: 'enum', 
    enum: Handedness,
    nullable: true 
  })
  @IsOptional()
  @IsEnum(Handedness)
  handedness?: Handedness;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid profile image URL' })
  profileImageUrl?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  @IsBoolean()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  emailVerified: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string;

  @Column({ type: 'varchar', length: 5, default: 'en' })
  preferredLanguage: string = 'en';

  // Relations
  @OneToMany(() => UserOrganization, userOrg => userOrg.user)
  userOrganizations: UserOrganization[];

  @OneToMany(() => TeamMember, teamMember => teamMember.user)
  teamMembers: TeamMember[];

  @OneToMany(() => ParentChildRelationship, rel => rel.parent)
  children: ParentChildRelationship[];

  @OneToMany(() => ParentChildRelationship, rel => rel.child)
  parents: ParentChildRelationship[];

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}