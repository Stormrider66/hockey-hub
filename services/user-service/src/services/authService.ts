import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

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
  private userRepository = AppDataSource.getRepository(User);
  private jwtPrivateKey: string;
  private jwtPublicKey: string;

  constructor() {
    // Load JWT keys
    const privateKeyPath = path.join(__dirname, '../../keys/jwt_private.pem');
    const publicKeyPath = path.join(__dirname, '../../keys/jwt_public.pem');
    
    this.jwtPrivateKey = fs.readFileSync(privateKeyPath, 'utf8');
    this.jwtPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
  }

  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email: data.email } 
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword
    });

    await this.userRepository.save(user);

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
        name: user.name,
        role: user.role
      }
    };
  }

  async login(credentials: LoginCredentials) {
    // Find user by email
    const user = await this.userRepository.findOne({ 
      where: { email: credentials.email } 
    });

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
        name: user.name,
        role: user.role
      }
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.jwtPublicKey, {
        algorithms: ['RS256']
      }) as TokenPayload;

      // Find user and check refresh token
      const user = await this.userRepository.findOne({ 
        where: { id: payload.userId } 
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      // Save new refresh token
      user.refreshToken = tokens.refresh_token;
      await this.userRepository.save(user);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (user) {
      user.refreshToken = undefined;
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
      algorithm: 'RS256',
      expiresIn: '15m'
    });

    const refresh_token = jwt.sign(payload, this.jwtPrivateKey, {
      algorithm: 'RS256',
      expiresIn: '7d'
    });

    return { access_token, refresh_token };
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtPublicKey, {
      algorithms: ['RS256']
    }) as TokenPayload;
  }
}