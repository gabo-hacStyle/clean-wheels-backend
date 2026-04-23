import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan, { StreamOptions } from 'morgan';
import rateLimit from "express-rate-limit";

import { env } from '@config/env'
import logger from '@utils/logger'

import adminRoutes from "@routes/admin.routes";

const app = express()

app.use(helmet());

app.use(
    cors({
        origin: env.ALLOWED_ORIGINS.split(','),
        credentials: true,
    }),
);

const stream: StreamOptions = {
    write: (message: string) => logger.info(message.trim()),
};

app.use(morgan('combined', { stream }));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: true,
        legacyHeaders: false,
    }),
)

app.use(express.json())

app.use('/api/admin', adminRoutes)

export default app;