import type { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger'

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const role = req.headers['x-user-role'] as String | undefined;
    const userId = req.headers['x-user-id'] as String | undefined;

    logger.debug('userId: ' + userId);
    logger.debug('role: ' + role);
    if (!userId || role !== 'ADMIN') {
        res.status(403).json({error: 'Acceso denegado'});
        return;
    }

    next();
};

declare global {
    namespace Express {
        interface Request {
            adminUserId?: string;
        }
    }
}

export const attachUser = (req: Request, _res: Response, next: NextFunction):void => {
    req.adminUserId = req.headers['x-user-id'] as string | undefined;
    next();
};