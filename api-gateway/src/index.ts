import app from "./app";
import { env } from '@config/env'
import logger from "@utils/logger";

const server = app.listen(env.PORT, () => {
    logger.info(`API Gateway corriendo en el puerto ${env.PORT} en modo ${env.NODE_ENV}`);
})

const shutdown = () => {
    logger.info("Cerrando servidor...");
    server.close(() => {
        logger.info("Servidor cerrado.");
        process.exit(0);
    })
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);