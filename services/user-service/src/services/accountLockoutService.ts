import { AppDataSource } from '../config/database';
import { LoginAttempt } from '../entities/LoginAttempt';
import { User } from '../entities/User';

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  attemptWindowMinutes: number;
}

export class AccountLockoutService {
  private config: LockoutConfig = {
    maxAttempts: 5,
    lockoutDurationMinutes: 30,
    attemptWindowMinutes: 15
  };

  constructor(config?: Partial<LockoutConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    userAgent?: string,
    failureReason?: string
  ): Promise<void> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    
    const attempt = attemptRepo.create({
      email,
      ipAddress,
      success,
      userAgent,
      failureReason
    });

    await attemptRepo.save(attempt);

    // Clean up old attempts
    await this.cleanupOldAttempts();
  }

  async isAccountLocked(email: string): Promise<{ locked: boolean; reason?: string; unlockAt?: Date }> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    const userRepo = AppDataSource.getRepository(User);

    // Check if user has manual lock
    const user = await userRepo.findOne({ where: { email } });
    if (user && !user.isActive) {
      return {
        locked: true,
        reason: 'Account has been deactivated'
      };
    }

    // Calculate time window
    const windowStart = new Date(Date.now() - this.config.attemptWindowMinutes * 60 * 1000);

    // Get failed attempts in the window
    const failedAttempts = await attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.email = :email', { email })
      .andWhere('attempt.success = :success', { success: false })
      .andWhere('attempt.createdAt >= :windowStart', { windowStart })
      .orderBy('attempt.createdAt', 'DESC')
      .getMany();

    if (failedAttempts.length >= this.config.maxAttempts) {
      const firstAttemptTime = failedAttempts[failedAttempts.length - 1].createdAt;
      const unlockAt = new Date(firstAttemptTime.getTime() + this.config.lockoutDurationMinutes * 60 * 1000);

      if (unlockAt > new Date()) {
        return {
          locked: true,
          reason: `Too many failed login attempts. Account locked for ${this.config.lockoutDurationMinutes} minutes.`,
          unlockAt
        };
      }
    }

    return { locked: false };
  }

  async isIpAddressBlocked(ipAddress: string): Promise<{ blocked: boolean; reason?: string }> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);

    // Check for excessive attempts from IP address
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour window
    const maxIpAttempts = 20; // Max attempts from single IP in 1 hour

    const ipAttempts = await attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.ipAddress = :ipAddress', { ipAddress })
      .andWhere('attempt.success = :success', { success: false })
      .andWhere('attempt.createdAt >= :windowStart', { windowStart })
      .getCount();

    if (ipAttempts >= maxIpAttempts) {
      return {
        blocked: true,
        reason: 'Too many failed login attempts from this IP address'
      };
    }

    return { blocked: false };
  }

  async getRemainingAttempts(email: string): Promise<number> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    const windowStart = new Date(Date.now() - this.config.attemptWindowMinutes * 60 * 1000);

    const failedAttempts = await attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.email = :email', { email })
      .andWhere('attempt.success = :success', { success: false })
      .andWhere('attempt.createdAt >= :windowStart', { windowStart })
      .getCount();

    return Math.max(0, this.config.maxAttempts - failedAttempts);
  }

  async clearLoginAttempts(email: string): Promise<void> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    
    await attemptRepo
      .createQueryBuilder()
      .delete()
      .where('email = :email', { email })
      .execute();
  }

  async getRecentLoginAttempts(
    email: string,
    limit: number = 10
  ): Promise<LoginAttempt[]> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);

    return attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.email = :email', { email })
      .orderBy('attempt.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getSuspiciousActivity(email: string): Promise<{
    differentIps: string[];
    failedAttempts: number;
    lastSuccessfulLogin?: Date;
  }> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get unique IPs
    const attempts = await attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.email = :email', { email })
      .andWhere('attempt.createdAt >= :last24Hours', { last24Hours })
      .getMany();

    const uniqueIps = [...new Set(attempts.map(a => a.ipAddress))];
    const failedAttempts = attempts.filter(a => !a.success).length;

    // Get last successful login
    const lastSuccess = await attemptRepo
      .createQueryBuilder('attempt')
      .where('attempt.email = :email', { email })
      .andWhere('attempt.success = :success', { success: true })
      .orderBy('attempt.createdAt', 'DESC')
      .getOne();

    return {
      differentIps: uniqueIps,
      failedAttempts,
      lastSuccessfulLogin: lastSuccess?.createdAt
    };
  }

  private async cleanupOldAttempts(): Promise<void> {
    const attemptRepo = AppDataSource.getRepository(LoginAttempt);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Delete attempts older than 30 days
    await attemptRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute();
  }
}