export interface JwtPayload {
  sub: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'GUEST';
  iat?: never;
  exp?: number;
}

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  AUTH_SERVICE_URL: string;
  BOOKING_SERVICE_URL: string;
  ADMIN_SERVICE_URL: string;
  NOTIFICATIONS_SERVICE_URL: string;
  ALLOWED_ORIGINS: string;
}
