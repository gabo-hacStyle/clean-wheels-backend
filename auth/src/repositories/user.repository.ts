import { pool } from '@config/database';
import type { User, UserRole } from '../types';

interface CreateUserDTO {
  email: string;
  googleId: string;
  role: UserRole;
}

class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, provider, provider_id
             FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, provider, provider_id
             FROM users WHERE provider_id = $1`,
      [googleId],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, provider, provider_id
             FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create({ email, googleId, role }: CreateUserDTO): Promise<User> {
    const { rows } = await pool.query<User>(
      `INSERT INTO users (email, provider_id, rol, provider)
             VALUES ($1, $2, $3, 'google')
                 RETURNING id, email, rol, provider_id, provider`,
      [email, googleId, role],
    );
    return rows[0] ?? null;
  }

  async updateRole(id: string, role: UserRole): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users SET rol = $1
             WHERE id = $2
                 RETURNING id, email, rol, cedula, provider_id, provider`,
      [role, id],
    );
    return rows[0] ?? null;
  }
}

export const userRepository = new UserRepository();
