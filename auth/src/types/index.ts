export type UserRole = 'CLIENT' | 'ADMIN' | 'GUEST';
export type AuthProvider = 'local' | 'google';

export interface User {
  id: number;
  email: string;
  rol: UserRole;
  provider?: AuthProvider;
  provider_id?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}

export interface GoogleUserInfo {
  googleId: string;
  email: string;
}

export interface LoginResult {
  token: string;
}

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  ALLOWED_ORIGINS: string;
  DB_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  ADMIN_EMAILS: string;
}
