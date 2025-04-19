import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';

const router = Router();
const authController = new AuthController();

// @ts-ignore - bypassing Express type conflicts
router.post('/register', authController.register);

// @ts-ignore - bypassing Express type conflicts  
router.post('/login', authController.login);

export default router; 