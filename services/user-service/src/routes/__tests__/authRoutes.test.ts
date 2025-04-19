import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
// import { AuthService } from '../../services/authService'; // No AuthService class exported
import authRoutes from '../authRoutes';
import { authenticateToken, AuthenticatedUser } from '../../middleware/authenticateToken'; // Needed for logout
import { validateRequest } from '../../middleware/validateRequest';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../../validations/authValidations';
import { ConflictError, UnauthorizedError } from '../../errors/authErrors';
import { User } from '../../entities/User';

// Mock dependencies
jest.mock('../../services/authService'); // Keep the service mocked
jest.mock('../../middleware/authenticateToken');
jest.mock('../../middleware/validateRequest');

// Import the mocked service methods individually
const mockRegister = require('../../services/authService').register as jest.Mock;
const mockLogin = require('../../services/authService').login as jest.Mock;
const mockRefreshToken = require('../../services/authService').refreshToken as jest.Mock;
const mockLogout = require('../../services/authService').logout as jest.Mock;
const mockForgotPassword = require('../../services/authService').forgotPassword as jest.Mock;
const mockResetPassword = require('../../services/authService').resetPassword as jest.Mock;

const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockValidateRequest = validateRequest as jest.Mock;

// Mock user for authenticated routes (like logout)
const mockUser = {
    userId: 'auth-user-123',
    roles: ['player'],
    permissions: [],
    organizationId: 'org-1',
    email: 'player@test.com',
    lang: 'en',
    teamIds: ['team-1']
} as any;

// Setup test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
            req.user = mockUser; // Attach user for authenticated routes
            next();
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    // --- POST /auth/register --- //
    describe('POST /register', () => {
        const registerData = { email: 'new@user.com', password: 'Password123!', firstName: 'New', lastName: 'User' };

        it('should register a user successfully', async () => {
            // Provide a more complete mock User object
            const createdUser = { 
                id: 'user-new', 
                email: registerData.email,
                firstName: registerData.firstName,
                lastName: registerData.lastName,
                preferredLanguage: 'sv', // Default from schema
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                passwordHash: 'hashedpassword', // Include required fields even if not checked
                roles: [], 
                teamMemberships: [], 
                childLinks: [], 
                parentLinks: [], 
                refreshTokens: [] 
            } as User;
            mockRegister.mockResolvedValue(createdUser);

            const response = await request(app)
                .post('/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe('user-new');
            expect(response.body.data.passwordHash).toBeUndefined(); // Ensure hash is excluded
            expect(mockRegister).toHaveBeenCalledWith(registerData);
        });

        it('should return 409 if email already exists', async () => {
            mockRegister.mockRejectedValue(new ConflictError('Email already in use'));
            const response = await request(app)
                .post('/auth/register')
                .send(registerData);

            expect(response.status).toBe(409);
            expect(response.body.code).toBe('USER_ALREADY_EXISTS');
        });
        
         it('should return 400 on validation error', async () => {
             // Mock validateRequest to simulate failure for this specific test
             mockValidateRequest.mockImplementation((schema) => {
                 return (req: Request, res: Response, next: NextFunction) => {
                     // Only fail for the register schema
                     if (schema === registerSchema) {
                         res.status(400).json({ 
                             error: true, 
                             message: 'Validation failed', 
                             code: 'VALIDATION_ERROR',
                             details: [{path: 'body.email', message: 'Invalid email'}]
                         });
                     } else {
                         next(); // Pass for other schemas if any
                     }
                 };
             });

            const response = await request(app)
                .post('/auth/register')
                .send({ email: 'invalid', password: 'short', firstName: 'F', lastName: 'L' });
                
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_ERROR');
            expect(mockRegister).not.toHaveBeenCalled();
        });
    });

    // --- POST /auth/login --- //
    describe('POST /login', () => {
        const loginCredentials = { email: 'test@user.com', password: 'Password123!' };

        it('should login successfully and return tokens', async () => {
            const loginResult = {
                accessToken: 'mockAccessToken',
                refreshToken: 'mockRefreshToken',
                user: { id: 'user-1', email: loginCredentials.email, firstName: 'Test'}
            };
            mockLogin.mockResolvedValue(loginResult);

            const response = await request(app)
                .post('/auth/login')
                .send(loginCredentials);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBe('mockAccessToken');
            expect(response.body.data.refreshToken).toBe('mockRefreshToken');
            expect(response.body.data.user.id).toBe('user-1');
            expect(mockLogin).toHaveBeenCalledWith(loginCredentials);
        });

        it('should return 401 for invalid credentials', async () => {
            mockLogin.mockRejectedValue(new UnauthorizedError('Invalid credentials'));
            const response = await request(app)
                .post('/auth/login')
                .send(loginCredentials);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_CREDENTIALS');
        });
    });

    // --- POST /auth/refresh-token --- //
    describe('POST /refresh-token', () => {
        const tokenData = { refreshToken: 'validRefreshToken' };

        it('should return new tokens successfully', async () => {
            const refreshResult = { accessToken: 'newAccessToken', refreshToken: 'newRotatedRefreshToken' };
            mockRefreshToken.mockResolvedValue(refreshResult);

            const response = await request(app)
                .post('/auth/refresh-token')
                .send(tokenData);

            expect(response.status).toBe(200);
            expect(response.body.data.accessToken).toBe('newAccessToken');
            expect(response.body.data.refreshToken).toBe('newRotatedRefreshToken');
            expect(mockRefreshToken).toHaveBeenCalledWith(tokenData.refreshToken);
        });

         it('should return 401 for invalid/expired refresh token', async () => {
            mockRefreshToken.mockRejectedValue(new UnauthorizedError('Invalid refresh token'));
             const response = await request(app)
                .post('/auth/refresh-token')
                .send({ refreshToken: 'invalidOrExpiredToken' });

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
        });
        
        it('should return 400 if refresh token is missing', async () => {
            const response = await request(app)
                .post('/auth/refresh-token')
                .send({}); // No token

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('REFRESH_TOKEN_REQUIRED');
        });
    });

    // --- POST /auth/logout --- //
    describe('POST /logout', () => {
        const tokenData = { refreshToken: 'validRefreshTokenToLogout' };
        
        it('should logout successfully', async () => {
            mockLogout.mockResolvedValue(undefined);

            const response = await request(app)
                .post('/auth/logout')
                .send(tokenData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Logged out successfully');
            expect(mockLogout).toHaveBeenCalledWith(tokenData.refreshToken);
        });

        it('should return 200 even if token is invalid or already revoked', async () => {
             // Service might log an error but controller returns success
            mockLogout.mockResolvedValue(undefined); // Simulate service not throwing error even if token invalid

            const response = await request(app)
                .post('/auth/logout')
                .send({ refreshToken: 'maybeInvalidToken' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    // --- POST /auth/forgot-password --- //
    describe('POST /forgot-password', () => {
        const forgotData = { email: 'user@example.com' };

        it('should always return 200 OK', async () => {
            mockForgotPassword.mockResolvedValue(undefined);
            const response = await request(app)
                .post('/auth/forgot-password')
                .send(forgotData);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('If an account with that email exists');
            expect(mockForgotPassword).toHaveBeenCalledWith(forgotData);
        });
    });

    // --- POST /auth/reset-password --- //
    describe('POST /reset-password', () => {
        const resetData = { token: 'validResetToken', newPassword: 'NewPassword123!' };

        it('should reset password successfully', async () => {
            mockResetPassword.mockResolvedValue(undefined);
            const response = await request(app)
                .post('/auth/reset-password')
                .send(resetData);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Password has been reset successfully');
            expect(mockResetPassword).toHaveBeenCalledWith(resetData);
        });

        it('should return 401 if token is invalid or expired', async () => {
            mockResetPassword.mockRejectedValue(new UnauthorizedError('Invalid or expired reset token'));
            const response = await request(app)
                .post('/auth/reset-password')
                .send({ token: 'invalidToken', newPassword: 'NewPassword123!' });
            
            expect(response.status).toBe(401);
            expect(response.body.code).toBe('INVALID_RESET_TOKEN');
        });
    });
}); 