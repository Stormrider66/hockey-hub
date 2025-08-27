import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';

@Entity('login_attempts')
@Index(['email', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  email!: string;

  @Column()
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column()
  success!: boolean;

  @Column({ nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt!: Date;
}