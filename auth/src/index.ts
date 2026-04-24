import app from './app';
import { env } from '@config/env';
import { initializeDatabase } from '@config/database';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
    await initializeDatabase();

    const server = app.listen(env.PORT, () => {
        logger.info(`Auth Service corriendo en el puerto ${env.PORT} en modo ${env.NODE_ENV}`);
    });

    const shutdown = (): void => {
        logger.info('Cerrando Auth Service...');
        server.close(() => {
            logger.info('Auth Service cerrado.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
    console.error('Error al iniciar Auth Service:', err);
    process.exit(1);
});