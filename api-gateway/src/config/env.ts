import Joi from "joi";
import 'dotenv/config'
import type { EnvConfig } from "../types";

const schema = Joi.object<EnvConfig>({
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    JWT_SECRET: Joi.string().required(),
    AUTH_SERVICE_URL: Joi.string().uri().required(),
    BOOKING_SERVICE_URL: Joi.string().uri().required(),
    ADMIN_SERVICE_URL: Joi.string().uri().required(),
    NOTIFICATIONS_SERVICE_URL: Joi.string().uri().required(),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
}).unknown();

const { error, value } = schema.validate(process.env);

if (error) {
    throw new Error("Error en la configuración de variables de entorno: " + error.message);
}

export const env = value as EnvConfig;