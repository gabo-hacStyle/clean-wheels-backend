import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from '@config/env';
import logger from '@utils/logger';
import authRoutes from './routes/auth.route';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  }),
);

app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

app.use(authRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app;
