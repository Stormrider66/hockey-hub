export declare class LoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
    deviceName?: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: string;
    organizationId?: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
    deviceName?: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarUrl?: string;
}
//# sourceMappingURL=auth.dto.d.ts.map