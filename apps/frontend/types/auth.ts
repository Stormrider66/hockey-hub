export interface LoginRequest {
  email: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage: 'sv' | 'en';
  roles: Role[];
}

export interface AuthResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
} 