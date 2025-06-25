export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    preferredLanguage?: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface ForgotPasswordDto {
    email: string;
}
export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}
//# sourceMappingURL=auth.dto.d.ts.map