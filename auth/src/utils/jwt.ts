import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types';

export const jwtUtil = {
  sign: (payload: Omit<JwtPayload, 'iat' | 'exp'>, duration?: jwt.SignOptions['expiresIn']): string =>
    jwt.sign(payload, (process.env.JWT_SECRET || ''), {
      expiresIn: duration ?? process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }),

  verify: (token: string): JwtPayload => jwt.verify(token, (process.env.JWT_SECRET || '')) as JwtPayload,
};
