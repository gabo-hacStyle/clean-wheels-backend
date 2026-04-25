import {NextFunction, Request, Response} from 'express';
import {jwtUtil} from '@utils/jwt';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token no proporcionado' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        (req as any).user = jwtUtil.verify(token);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};