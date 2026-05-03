import { userRepository } from '../repositories/user.repository';
import { googleService } from './google.service';
import { jwtUtil } from '@utils/jwt';
import { env } from '@config/env';
import type { LoginResult, UserRole } from '../types';
import logger from '@utils/logger';

const ADMIN_EMAILS: string[] = env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? [];

class AuthService {
  getGoogleAuthUrl(): string {
    return googleService.getAuthUrl();
  }

  async handleGoogleCallback(code: string): Promise<LoginResult> {
    const googleUser = await googleService.exchangeCode(code);

    let user = await userRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await userRepository.findByEmail(googleUser.email);
    }

    if (!user) {
      const role: UserRole =
        ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(googleUser.email) ? 'ADMIN' : 'CLIENT';

      user = await userRepository.create({
        email: googleUser.email,
        googleId: googleUser.googleId,
        role: role
      });

      logger.info(`Nuevo usuario creado: ${googleUser.email} con rol ${role}`);
    }

    const token = jwtUtil.sign({
      sub: user.id.toString(),
      email: user.email,
      rol: user.rol,
    });

    logger.info(`Login exitoso ${user.email} (${user.rol}`);
    return {
      token
    };
  }

  async getUserById(id: string) {
    return userRepository.findById(id);
  }

  async guestLogin(): Promise<LoginResult> {
    const token = jwtUtil.sign({
      sub: "anonymous",
      email: "undefined",
      rol: "GUEST"
    }, "1d");

    return {
      token
    }
  }
}

export const authService = new AuthService();
