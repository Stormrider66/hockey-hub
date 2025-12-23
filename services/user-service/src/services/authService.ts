// @ts-nocheck - Complex auth service needs refactoring
import { getDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PasswordValidator } from '../utils/passwordValidator';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  teamCode?: string;
}

interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export class AuthService {
  private userRepository = getDataSource().getRepository(User);
  private passwordResetRepository = getDataSource().getRepository(PasswordResetToken);
  private jwtPrivateKey: string;
  private jwtPublicKey: string;
  private useHmac = process.env.NODE_ENV === 'test' || process.env.JWT_ALG === 'HS256';
  private passwordValidator = new PasswordValidator();

  constructor() {
    // Load JWT secrets/keys
    if (this.useHmac) {
      const secret = process.env.JWT_SECRET || 'test-secret';
      this.jwtPrivateKey = secret;
      this.jwtPublicKey = secret;
    } else {
      const privateKeyPath = path.join(__dirname, '../../keys/jwt_private.pem');
      const publicKeyPath = path.join(__dirname, '../../keys/jwt_public.pem');
      this.jwtPrivateKey = fs.readFileSync(privateKeyPath, 'utf8');
      this.jwtPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
    }
  }

  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user
    const user: any = await this.userRepository.save({
      ...data,
      password: hashedPassword,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refresh_token;
    await this.userRepository.save(user);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: typeof (user as any).role === 'string' ? (user as any).role : (user as any).role?.name || 'player'
      }
    };
  }

  async login(credentials: LoginCredentials) {
    // Find user by email
    const user: any = await this.userRepository.findOne({ where: { email: credentials.email } });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();

    if (user.isActive === false) {
      throw new Error('Account is deactivated');
    }
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    // Save refresh token
    user.refreshToken = tokens.refresh_token;
    await this.userRepository.save(user);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: typeof (user as any).role === 'string' ? (user as any).role : (user as any).role?.name || 'player'
      }
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.jwtPublicKey, { algorithms: [this.useHmac ? 'HS256' : 'RS256'] as any }) as TokenPayload;

      // Find user and check refresh token
      const user = await this.userRepository.findOne({ where: { id: payload.userId } });

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      // Save new refresh token
      user.refreshToken = tokens.refresh_token;
      await this.userRepository.save(user);

      return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (user) {
      user.refreshToken = undefined as any;
      await this.userRepository.save(user);
    }
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }

  private generateTokens(user: User) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const access_token = jwt.sign(payload, this.jwtPrivateKey, {
      algorithm: (this.useHmac ? 'HS256' : 'RS256') as any,
      expiresIn: '15m',
      jwtid: crypto.randomUUID(),
    });

    const refresh_token = jwt.sign(payload, this.jwtPrivateKey, {
      algorithm: (this.useHmac ? 'HS256' : 'RS256') as any,
      expiresIn: '7d',
      jwtid: crypto.randomUUID(),
    });

    return { access_token, refresh_token };
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtPublicKey, {
      algorithms: [this.useHmac ? 'HS256' : 'RS256'] as any
    }) as TokenPayload;
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ 
      where: { email } 
    });

    // Don't reveal if user exists or not
    if (!user) {
      return;
    }

    // Delete any existing reset tokens for this user
    await this.passwordResetRepository.delete({ userId: user.id });

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Create reset token with 1 hour expiry
    const resetToken = this.passwordResetRepository.create({
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      ipAddress: '', // Should be passed from controller
      userAgent: '' // Should be passed from controller
    });

    await this.passwordResetRepository.save(resetToken);

    // TODO: Send email with reset link containing the unhashed token
    // For now, just log it (remove in production)
    console.log(`Password reset token for ${email}: ${token}`);
    
    // In production, this would send an email like:
    // await emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the provided token to match stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await this.passwordResetRepository.findOne({
      where: {
        token: hashedToken,
        used: false
      },
      relations: ['user']
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Validate new password
    const passwordValidation = this.passwordValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = resetToken.user;
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Mark token as used
    resetToken.used = true;
    resetToken.usedAt = new Date();
    await this.passwordResetRepository.save(resetToken);

    // Invalidate all refresh tokens for security
    user.refreshToken = undefined;
    await this.userRepository.save(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = this.passwordValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Make sure new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    // Invalidate refresh token for security
    user.refreshToken = undefined;
    
    await this.userRepository.save(user);
  }
}