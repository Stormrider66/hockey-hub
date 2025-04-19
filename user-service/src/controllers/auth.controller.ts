import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User } from '../entities/user.entity';

// Define controller handler types
type ControllerHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class AuthController {
  private authService = new AuthService();

  // @ts-ignore - bypassing Express type conflicts
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: RegisterUserDto = req.body;
      const newUser: Omit<User, 'passwordHash'> = await this.authService.registerUser(userData);
      res.status(201).json({ data: newUser, message: 'User registered successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @ts-ignore - bypassing Express type conflicts
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: LoginUserDto = req.body;
      const { accessToken, refreshToken, user } = await this.authService.loginUser(credentials);
      res.status(200).json({ data: { accessToken, refreshToken, user }, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  };

  // TODO: Implement refreshToken, logout methods
} 