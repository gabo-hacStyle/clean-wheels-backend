import winston from 'winston'
import { env } from '@config/env'

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    https: 3,
    debug: 4,
}

const level = () => {
    const envLevel = env.NODE_ENV || 'development';
    return envLevel === 'development' ? 'debug' : 'warn';
}

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '../logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '../logs/all.log' }),
]

export default winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});