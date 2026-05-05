import { Pool } from 'pg';
import logger from '@utils/logger';

export const pool = new Pool({
  connectionString: process.env.DB_URL,
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
