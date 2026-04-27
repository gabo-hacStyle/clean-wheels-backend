// user.repository.ts corregido
import { pool } from '@config/database';
import type { User, UserRole } from '../types';

interface CreateUserDTO {
  email: string;
  googleId: string;
  role: UserRole;
  cedula: string;
}

class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, cedula, provider, provider_id
             FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, cedula, provider, provider_id
             FROM users WHERE provider_id = $1`,
      [googleId],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT id, email, rol, cedula, provider, provider_id
             FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create({ email, googleId, role, cedula }: CreateUserDTO): Promise<User> {
    const { rows } = await pool.query<User>(
      `INSERT INTO users (email, provider_id, rol, provider, cedula)
             VALUES ($1, $2, $3, 'google', $4)
                 RETURNING id, email, rol, cedula, provider_id, provider`,
      [email, googleId, role, cedula ?? null],
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

  async updateCedula(id: string, cedula: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users SET cedula = $1
            WHERE id = $2
                RETURNING id, email, rol, cedula, provider_id, provider`,
      [cedula, id],
    );
    return rows[0] ?? null;
  }
}

export const userRepository = new UserRepository();
