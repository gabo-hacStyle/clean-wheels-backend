import { OAuth2Client } from 'google-auth-library';
import { env } from '@config/env'
import { GoogleUserInfo } from "../types";
import logger from "@utils/logger";

class GoogleService {
    private readonly client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            env.GOOGLE_REDIRECT_URI
        );
    }

    getAuthUrl(): string {
        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'email', 'profile'],
            prompt: 'consent'
        });
    }

    async exchangeCode(code: string): Promise<GoogleUserInfo> {
        try {
            logger.info(`[Google] Intentando canjear código: ${code.substring(0, 10)}...`);

            const cleanCode = decodeURIComponent(code.trim());
            const { tokens } = await this.client.getToken(cleanCode);
            logger.info('[Google] Tokens obtenidos exitosamente');

            this.client.setCredentials(tokens);

            if (!tokens.id_token) {
                throw new Error('No se recibió id_token de Google');
            }

            const verifier = new OAuth2Client(env.GOOGLE_CLIENT_ID);
            const ticket = await verifier.verifyIdToken({
                idToken: tokens.id_token,
                audience: env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload()!;

            if (!payload) throw new Error('Token de Google inválido');

            logger.info(`[Google] Usuario autenticado: ${payload.email}`);
            return {
                googleId: payload.sub,
                email: payload.email!
            }
        } catch (error: any) {
            logger.error(`[Google] Error al canjear código: ${error.message}`);
            logger.error(`[Google] Detalles: ${JSON.stringify(error)}`);
            throw new Error('Error al autenticar con Google');
        }
    }
}

export const googleService = new GoogleService();