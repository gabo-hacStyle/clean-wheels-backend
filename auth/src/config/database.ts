import { Pool } from 'pg';
import { env } from '@config/env';
import logger from '@utils/logger';

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
  logger.debug('Nueva conexión PostgreSQL establecida');
});
