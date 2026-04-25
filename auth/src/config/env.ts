import Joi from "joi";
import 'dotenv/config'
import type { EnvConfig } from "../types";

const schema = Joi.object<EnvConfig>({
    PORT: Joi.number().default(3020),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
    DB_URL: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_REDIRECT_URI: Joi.string().required(),
    ADMIN_EMAILS: Joi.string().default(''),
}).unknown();

const { error, value } = schema.validate(process.env);

if (error) {
    throw new Error("Error en la configuración de variables de entorno: " + error.message);
}

export const env = value as EnvConfig;