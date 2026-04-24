import { Pool } from 'pg';
import { env } from "@config/env";
import logger from "@utils/logger";

export const pool = new Pool({
    connectionString: env.DB_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
});

pool.on('error', (err: Error) => {
    logger.error('PostgreSQL pool error', err);
});

pool.on('connect', () => {
    logger.debug('Nueva conexión PostgreSQL establecida')
});

export async function initializeDatabase() {
    const client = await pool.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                rol VARCHAR(20) NOT NULL DEFAULT 'CLIENT' CHECK (rol IN ('CLIENT', 'ADMIN', 'VISITANT')),
                cedula VARCHAR(50),
                google_id VARCHAR(255) UNIQUE,
                auth_provider VARCHAR(20) NOT NULL DEFAULT 'google',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        logger.info("Base de datos inicializada correctamente");
    } finally {
        client.release();
    }
}