import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { User } from '../entities/user.entity';
import AppDataSource from '../data-source'; // Now using the local data-source.ts
import { RequestHandler } from 'express';

// Define controller handler types
type ControllerHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class AuthController {
  // Get the UserRepository from the DataSource
  private userRepository = AppDataSource.getRepository(User);
  // Instantiate AuthService with the repository
  private authService = new AuthService(this.userRepository);

  // Explicitly type controller methods for router compatibility
  public register: RequestHandler = async (req, res, next) => {
    try {
      const userData: RegisterUserDto = req.body;
      const newUser = await this.authService.registerUser(userData);
      res.status(201).json({ data: newUser, message: 'User registered successfully' });
    } catch (error) {
      next(error);
    }
  };

  public login: RequestHandler = async (req, res, next) => {
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