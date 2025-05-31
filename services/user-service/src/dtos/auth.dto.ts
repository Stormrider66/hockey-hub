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

// DTO for the forgot password request
export interface ForgotPasswordDto {
  email: string;
}

// DTO for the reset password request
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
} 