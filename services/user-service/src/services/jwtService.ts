import { SignJWT, importJWK, exportJWK, generateKeyPair } from 'jose';
import { JWK } from 'jose';
import fs from 'fs/promises';
import path from 'path';
import { User } from '../entities/User';
import { UserOrganization } from '../entities/UserOrganization';
import { RefreshToken } from '../entities/RefreshToken';
import { AppDataSource } from '../config/database';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
  teamIds: string[];
  lang: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class JWTService {
  private privateKey: any;
  private publicKey: any;
  private kid: string = 'default-key-id';
  private issuer: string = 'user-service';
  private audience: string = 'hockeyhub-internal';
  private accessTokenExpiry: string = '15m';
  private refreshTokenExpiry: string = '7d';
  private keysPath: string = path.join(__dirname, '../../keys');

  constructor() {
    this.initializeKeys();
  }

  private async initializeKeys() {
    try {
      // Try to load existing keys
      await this.loadKeys();
    } catch (error) {
      // Generate new keys if not found
      await this.generateAndSaveKeys();
    }
  }

  private async loadKeys() {
    const privateKeyPath = path.join(this.keysPath, 'private.key');
    const publicKeyPath = path.join(this.keysPath, 'public.key');

    const privateKeyData = await fs.readFile(privateKeyPath, 'utf8');
    const publicKeyData = await fs.readFile(publicKeyPath, 'utf8');

    this.privateKey = await importJWK(JSON.parse(privateKeyData), 'RS256');
    this.publicKey = await importJWK(JSON.parse(publicKeyData), 'RS256');
  }

  private async generateAndSaveKeys() {
    // Generate RSA key pair
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    
    // Export keys as JWK
    const publicJwk = await exportJWK(publicKey);
    const privateJwk = await exportJWK(privateKey);

    // Add key ID and use
    publicJwk.kid = this.kid;
    publicJwk.use = 'sig';
    privateJwk.kid = this.kid;
    privateJwk.use = 'sig';

    // Create keys directory if it doesn't exist
    await fs.mkdir(this.keysPath, { recursive: true });

    // Save keys
    await fs.writeFile(
      path.join(this.keysPath, 'private.key'),
      JSON.stringify(privateJwk, null, 2)
    );
    await fs.writeFile(
      path.join(this.keysPath, 'public.key'),
      JSON.stringify(publicJwk, null, 2)
    );

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  async getJWKS(): Promise<{ keys: JWK[] }> {
    const publicJwk = await exportJWK(this.publicKey);
    publicJwk.kid = this.kid;
    publicJwk.use = 'sig';
    publicJwk.alg = 'RS256';

    return {
      keys: [publicJwk]
    };
  }

  async generateTokenPair(
    user: User,
    userOrg: UserOrganization
  ): Promise<TokenPair> {
    // Get user permissions
    const permissions = userOrg.getPermissions();

    // Get team IDs for the user
    const teamMemberRepo = AppDataSource.getRepository('TeamMember');
    const teamMemberships = await teamMemberRepo.find({
      where: {
        userId: user.id,
        isActive: true
      },
      select: ['teamId']
    });
    const teamIds = teamMemberships.map(tm => tm.teamId);

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: [userOrg.role],
      permissions,
      organizationId: userOrg.organizationId,
      teamIds,
      lang: user.preferredLanguage || 'en'
    };

    // Generate access token
    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: this.kid })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(this.accessTokenExpiry)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(this.privateKey);

    // Generate refresh token
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    
    // Save refresh token to database
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    const refreshToken = refreshTokenRepo.create({
      token: refreshTokenValue,
      userId: user.id,
      organizationId: userOrg.organizationId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: '', // Should be passed from request
      ipAddress: '' // Should be passed from request
    });
    await refreshTokenRepo.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  async refreshAccessToken(
    refreshTokenValue: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<TokenPair | null> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    
    // Find valid refresh token
    const refreshToken = await refreshTokenRepo.findOne({
      where: {
        token: refreshTokenValue,
        isActive: true
      }
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      return null;
    }

    // Check if token is being used from different device/location
    if (userAgent && refreshToken.userAgent !== userAgent) {
      // Log security event - token used from different device
      console.warn('Refresh token used from different device', {
        userId: refreshToken.userId,
        originalUserAgent: refreshToken.userAgent,
        currentUserAgent: userAgent
      });
    }

    // Get user and organization data
    const userRepo = AppDataSource.getRepository(User);
    const userOrgRepo = AppDataSource.getRepository(UserOrganization);

    const user = await userRepo.findOne({
      where: { id: refreshToken.userId }
    });

    if (!user || !user.isActive) {
      return null;
    }

    const userOrg = await userOrgRepo.findOne({
      where: {
        userId: user.id,
        organizationId: refreshToken.organizationId,
        isActive: true
      },
      relations: ['roleEntity', 'roleEntity.permissions']
    });

    if (!userOrg) {
      return null;
    }

    // Rotate refresh token (create new one, invalidate old one)
    refreshToken.isActive = false;
    refreshToken.revokedAt = new Date();
    await refreshTokenRepo.save(refreshToken);

    // Generate new token pair
    return this.generateTokenPair(user, userOrg);
  }

  async revokeRefreshToken(refreshTokenValue: string): Promise<void> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    
    await refreshTokenRepo.update(
      { token: refreshTokenValue },
      { 
        isActive: false,
        revokedAt: new Date()
      }
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    
    await refreshTokenRepo.update(
      { userId, isActive: true },
      { 
        isActive: false,
        revokedAt: new Date()
      }
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    
    // Delete tokens that expired more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :date', { date: thirtyDaysAgo })
      .execute();
  }
}

export const jwtService = new JWTService();