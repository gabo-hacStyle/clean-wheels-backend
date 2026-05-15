import Joi from 'joi';
import 'dotenv/config';

interface EnvConfig {
    PORT: number;
    NODE_ENV: string;
    DB_URL: string;
    ALLOWED_ORIGINS: string;
}

const schema = Joi.object<EnvConfig>({
    PORT: Joi.number().default(3003),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    DB_URL: Joi.string().uri().required(),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
}).unknown();

const { error, value } = schema.validate(process.env);
if (error) throw new Error('Error en configuración de env: ' + error.message);

export const env = value as EnvConfig;