import { pool } from '@config/database';
import type { User, UserRole } from '../types';

interface CreateUserDTO {
    email: string;
    googleId: string;
    role: UserRole
}

class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await pool.query<User>('SELECT * FROM users WHERE email=$1',[email]);
        return rows[0] ?? null;
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const { rows } = await pool.query<User>('SELECT * FROM users WHERE google_id=$1',[googleId]);
        return rows[0] ?? null;
    }

    async findById(id: string): Promise<User | null> {
        const { rows } = await pool.query<User>('SELECT * FROM users WHERE id=$1',[id]);
        return rows[0] ?? null;
    }

    async create({ email, googleId, role }: CreateUserDTO): Promise<User> {
        const { rows } = await pool.query<User>('' +
            'INSERT INTO users (email, google_id, role, auth_provider) values ($1, $2, $3, $4) RETURNING *',
            [email, googleId, role]);
        return rows[0] ?? null;
    }
}

export const userRepository = new UserRepository();