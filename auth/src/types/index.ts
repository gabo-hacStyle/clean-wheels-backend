export type UserRole = 'CLIENT' | 'ADMIN' | 'VISITANT';
export type AuthProvider = 'local' | 'google';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    number_document: string | null;
    google_id: string | null;
    auth_provider: AuthProvider;
    created_at: Date;
    updated_at: Date;
}

export interface Session {
    id: string;
    user_id: string;
    token: string;
    created_at: Date;
    expires_at: Date;
    is_active: boolean;
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface GoogleUserInfo {
    googleId: string;
    email: string;
    name: string;
}

export interface LoginResult {
    token: string;
    user: Pick<User, 'id' | 'email' | 'role'>;
}

export interface EnvConfig {
    PORT: number;
    NODE_ENV: string;
    DB_URL: string;
    JWT_SECRET: string;
    ALLOWED_ORIGINS: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
}
