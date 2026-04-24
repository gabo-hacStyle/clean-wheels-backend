import type { Request, Response } from 'express';
import { authService } from "../services/auth.service";
import logger from "@utils/logger";

export const authController = {
    // GET /auth/google
    googleLogin: (_req: Request, res: Response): void => {
        const url = authService.getGoogleAuthUrl();
        res.json({ url });
    },

    // GET /auth/google/callback
    googleCallback: async (req: Request, res: Response): Promise<void> => {
        const { code } = req.query;

        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'Código de autorización no recibido' });
            return;
        }

        try {
            const result = await authService.handleGoogleCallback(code);

            res.status(200).json({
                message: 'Autenticación exitosa',
                token: result.token,
                user: result.user,
            });
        } catch (err) {
            logger.error('Error en callback de Google', err);
            res.status(401).json({ error: 'Error en la autenticación con Google' });
        }
    },


    // GET /auth/me
    me: async (req: Request, res: Response): Promise<void> => {
        const authHeader = req.headers.authorization;

        if(!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token requerido' });
            return;
        }

        try {
            const token = authHeader.split(' ')[1];
            const payload = await authService.validateToken(token);
            const user = await authService.getUserById(payload.sub);

            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }

            res.status(200).json({
                id: user.id,
                email: user.email,
                role: user.role,
            });
        } catch {
            res.status(401).json({ error: 'Token inválido o expirado' });
        }
    },

    me2(req: Request, res: Response): void {
        const userId = req.headers['x-user-id'];
        const role = req.headers['x-user-role'];

        if (!userId) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        res.json({ userId, role });
    }

}