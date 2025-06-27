import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserRole } from '../models/User';
import { AuthRequest } from '../middleware/authenticate';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, teamCode } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Email, password, firstName, and lastName are required' 
        });
      }

      // Validate role
      if (role && !Object.values(UserRole).includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role' 
        });
      }

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role: role || UserRole.PLAYER,
        teamCode
      });

      res.json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: error.message || 'Registration failed' 
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ 
        error: error.message || 'Login failed' 
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ 
          error: 'Refresh token is required' 
        });
      }

      const result = await authService.refreshToken(refresh_token);
      res.json(result);
    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(401).json({ 
        error: error.message || 'Token refresh failed' 
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await authService.logout(req.user.userId);
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        error: 'Logout failed' 
      });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await authService.getMe(req.user.userId);
      res.json(user);
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(404).json({ 
        error: error.message || 'User not found' 
      });
    }
  }
}