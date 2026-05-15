import app from './app';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  const server = app.listen(process.env.PORT, () => {
    logger.info(`Auth Service corriendo en el puerto ${process.env.PORT} en modo ${process.env.NODE_ENV}`);
  });

  const shutdown = (): void => {
    logger.info('Cerrando Admin Service...');
    server.close(() => {
      logger.info('Admin Service cerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Error al iniciar Admin Service:', err);
  process.exit(1);
});
