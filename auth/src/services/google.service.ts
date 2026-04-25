import { OAuth2Client } from 'google-auth-library';
import { env } from '@config/env'
import { GoogleUserInfo } from "../types";

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
        const { tokens } = await this.client.getToken(code);
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

        return {
            googleId: payload.sub,
            email: payload.email!
        }
    }
}

export const googleService = new GoogleService();