import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import type { Request, Response } from "express";
import { env } from "@config/env";
import logger from "@utils/logger";

export const authProxy = createProxyMiddleware<Request>({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
    on: {
        proxyReq: (proxyReq, req) => {
            fixRequestBody(proxyReq, req);
        },
        error: (_err, _req, res) => {
            logger.error('Auth Service proxy error', _err);
            (res as Response).status?.(502).json({ error: 'Auth Service no disponible' })
        },
    },
});
