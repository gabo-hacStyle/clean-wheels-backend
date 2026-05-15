import app from './app';
import logger from '@utils/logger';

const server = app.listen(process.env.PORT, () => {
  logger.info(`API Gateway corriendo en el puerto ${process.env.PORT} en modo ${process.env.NODE_ENV}`);
});

const shutdown = () => {
  logger.info('Cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
