export type UserRole = 'CLIENT' | 'ADMIN' | 'VISITANT';
export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  email: string;
  rol: UserRole;
  cedula: string | null;
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

export interface RegisterDTO {
  googleId: string;
  cedula: string;
}

export interface LoginDTO {
  googleId: string;
}

export interface LoginResult {
  token: string;
  user: Pick<User, 'id' | 'email' | 'rol'>;
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
