import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { Request, Response } from 'express';
import { env } from '@config/env';
import logger from '@utils/logger';

export const bookingProxy = createProxyMiddleware<Request>({
  target: env.BOOKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/bookings': '' },
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
      logger.error('Booking Service proxy error', _err);
      (res as Response).status?.(502).json({ error: 'Booking Service no disponible' });
    },
  },
});
