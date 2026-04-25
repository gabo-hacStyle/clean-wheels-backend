import type { Request, Response } from 'express';
import { authService } from "../services/auth.service";
import logger from "@utils/logger";

export const authController = {
    // GET /auth/google
    googleLogin: (_req: Request, res: Response): void => {
        const url = authService.getGoogleAuthUrl();
        res.json({ url });
    },

    // POST /auth/google
    googleCallback: async (req: Request, res: Response) => {
        try {
            const { code } = req.body;

            if (!code || typeof code !== 'string') {
                res.status(400).json({ error: 'Código requerido' });
                return;
            }
            const result = await authService.handleGoogleCallback(code);

            res.status(200).json({
                token: result.token
            });
        } catch (err) {
            logger.error('Error en callback de Google', err);
            res.status(401).json({ error: 'Error en la autenticación con Google' });
        }
    },


    // GET /auth/me
    me: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.sub;
            const user = await authService.getUserById(userId);
            if (!user) {
                res.status(404).json({error: 'Usuario no encontrado'});
                return;
            }
            res.json({
                id: user.id,
                email: user.email,
                rol: user.rol,
                cedula: user.cedula,
            });
        } catch (err) {
            logger.error('Error en getProfile', err);
            res.status(500).json({ error: 'Error interno' });
        }
    },

    updateProfile: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.sub;
            const { cedula } = req.body;

            if (!cedula) {
                res.status(404).json({error: 'Cédula requerida'});
                return;
            }

            const updated = await authService.updateCedula(userId, cedula);
            res.json(updated);
        } catch (err: any) {
            logger.error('Error en update profile', err);
            logger.error('Error en update profile: ' + err.message);
            res.status(500).json({ error: 'Error interno' });
        }
    }
}
