import { User } from '../entities';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto';
/**
 * Request a password reset. Generates a token and sends the email.
 */
export declare const forgotPassword: (data: ForgotPasswordDto) => Promise<void>;
/**
 * Reset password using the token received via email
 */
export declare const resetPassword: (data: ResetPasswordDto) => Promise<void>;
export declare const register: (userData: RegisterDto) => Promise<User>;
export declare const login: (credentials: LoginDto) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
}>;
export declare const refreshToken: (incomingRefreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const logout: (incomingRefreshToken: string) => Promise<void>;
//# sourceMappingURL=authService.d.ts.map