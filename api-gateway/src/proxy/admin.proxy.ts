import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { Request, Response } from 'express';
import { env } from '@config/env';
import logger from '@utils/logger';

export const adminProxy = createProxyMiddleware<Request>({
  target: env.ADMIN_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/admin': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.sub);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
      fixRequestBody(proxyReq, req);
    },
    error: (_err, _req, res) => {
      logger.error('Admin Service proxy error', _err);
      (res as Response).status?.(502).json({ error: 'Admin Service no disponible' });
    },
  },
});
