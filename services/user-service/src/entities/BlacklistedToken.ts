import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

@Entity('blacklisted_tokens')
@Index(['jti', 'expiresAt'])
export class BlacklistedToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  jti!: string; // JWT ID

  @Column('uuid')
  userId!: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  blacklistedAt!: Date;
}