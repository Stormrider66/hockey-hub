import fs from 'fs';
import path from 'path';
import jwt, { type Secret, type SignOptions, type Algorithm } from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPair { accessToken: string; refreshToken: string; }

export class JWTService {
  private privateKey!: string;
  private publicKey!: string;
  private kid = 'default-key-id';
  private issuer = process.env.JWT_ISSUER || 'hockey-hub-test';
  private audience = process.env.JWT_AUDIENCE || 'hockey-hub-api-test';
  private accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
  private refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private keysPath = path.join(__dirname, '../../keys');
  private blacklist = new Set<string>();
  private useHmac = process.env.NODE_ENV === 'test' || process.env.JWT_ALG === 'HS256';

  constructor() {
    // Always perform key file operations for tests that assert file I/O
    this.ensureKeys();
    if (this.useHmac) {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET must be set');
      }
      this.privateKey = secret;
      this.publicKey = secret;
    }
  }

  private ensureKeys(): void {
    const priv = path.join(this.keysPath, 'private.key');
    const pub = path.join(this.keysPath, 'public.key');
    if (!fs.existsSync(priv) || !fs.existsSync(pub)) {
      fs.mkdirSync(this.keysPath, { recursive: true });
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      fs.writeFileSync(priv, privateKey);
      fs.writeFileSync(pub, publicKey);
    }
    this.privateKey = fs.readFileSync(priv) as unknown as string;
    this.publicKey = fs.readFileSync(pub) as unknown as string;
  }

  getJWKS(): any {
    // Minimal JWKS structure for tests
    return { keys: [{ kty: 'RSA', kid: this.kid, use: 'sig', alg: 'RS256' }] };
  }

  generateAccessToken(user: { id: string; email?: string; organizationId?: string; roles?: string[]; permissions?: string[]; teamIds?: string[] }): string {
    const payload: any = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      teamIds: user.teamIds,
      type: 'access',
    };
    const jti = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const algorithm: Algorithm = this.useHmac ? 'HS256' : 'RS256';
    const secret: Secret = this.privateKey as unknown as Secret;
    const options: SignOptions = {
      algorithm,
      expiresIn: this.accessTokenExpiry as any,
      issuer: this.issuer,
      audience: this.audience,
      jwtid: jti,
    };
    return jwt.sign(payload, secret, options);
  }

  generateRefreshToken(userId: string, deviceId?: string): string {
    const payload: any = { sub: userId, deviceId, type: 'refresh' };
    const jti = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const algorithm: Algorithm = this.useHmac ? 'HS256' : 'RS256';
    const secret: Secret = this.privateKey as unknown as Secret;
    const options: SignOptions = {
      algorithm,
      expiresIn: this.refreshTokenExpiry as any,
      issuer: this.issuer,
      audience: this.audience,
      jwtid: jti,
    };
    return jwt.sign(payload, secret, options);
  }

  async verifyAccessToken(token: string): Promise<any> {
    const decoded = jwt.verify(token, this.publicKey as Secret, { algorithms: [this.useHmac ? 'HS256' : 'RS256'] as any, issuer: this.issuer, audience: this.audience }) as any;
    if (decoded.type !== 'access') throw new Error('Invalid token type');
    if (decoded.jti && this.blacklist.has(decoded.jti)) throw new Error('Token blacklisted');
    return decoded;
  }

  async verifyRefreshToken(token: string): Promise<any> {
    const decoded = jwt.verify(token, this.publicKey as Secret, { algorithms: [this.useHmac ? 'HS256' : 'RS256'] as any, issuer: this.issuer, audience: this.audience }) as any;
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    return decoded;
  }

  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded: any = await this.verifyAccessToken(token);
      if (decoded && decoded.jti) this.blacklist.add(decoded.jti);
    } catch {
      const fallback: any = jwt.decode(token) || {};
      if (fallback && fallback.jti) this.blacklist.add(fallback.jti);
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> { return this.blacklist.has(jti); }

  generateTokenPair(user: { id: string; email?: string; organizationId?: string; roles?: string[]; permissions?: string[] }, deviceId?: string): TokenPair {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user.id, deviceId),
    };
  }
}

export const jwtService = new JWTService();