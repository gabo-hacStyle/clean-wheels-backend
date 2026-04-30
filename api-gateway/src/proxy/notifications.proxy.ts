import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { Request, Response } from 'express';
import { env } from '@config/env';
import logger from '@utils/logger';

export const notificationsProxy = createProxyMiddleware<Request>({
  target: env.NOTIFICATIONS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
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
      logger.error('Notifications Service proxy error', _err);
      (res as Response).status?.(502).json({ error: 'Notifications Service no disponible' });
    },
  },
});
