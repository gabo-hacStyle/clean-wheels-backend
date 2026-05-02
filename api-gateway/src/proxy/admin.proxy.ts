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
        proxyReq.setHeader('X-User-Role', req.user.rol);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
      logger.info('===== USER DATA =====');
      logger.info(JSON.stringify(req.user, null, 2));

      logger.info('===== REQUEST DATA =====');
      logger.info(JSON.stringify({
        method: req.method,
        originalUrl: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body,
        params: req.params
      }, null, 2));

      logger.info('===== PROXY HEADERS =====');
      logger.info(JSON.stringify(proxyReq.getHeaders(), null, 2));
      fixRequestBody(proxyReq, req);
    },
    error: (_err, _req, res) => {
      logger.error('Admin Service proxy error', _err);
      (res as Response).status?.(502).json({ error: 'Admin Service no disponible' });
    },
  },
});
