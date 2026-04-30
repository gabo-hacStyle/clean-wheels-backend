import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import type { JwtPayload } from '../types';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).send('Token requerido');
    return;
  }

  try {
    const token = authHeader?.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'string') {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireRole =
  (...roles: JwtPayload['role'][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    next();
  };
