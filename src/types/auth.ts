export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'BUYER' | 'ORGANISER' | 'ADMIN';
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  role: 'BUYER' | 'ORGANISER';
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthError {
  error: string;
  timestamp?: string;
  field?: string;
  fields?: Record<string, string>;
}
