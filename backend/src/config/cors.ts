import cors, { CorsOptions } from 'cors';
import { config } from './env.js';

export function getCorsOptions(): CorsOptions {
  const allowedOrigins = config.FRONTEND_URL.split(',').map((origin) => origin.trim());

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server) in non-production
      if (!origin) {
        if (config.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(null, false);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

export const corsMiddleware = cors(getCorsOptions());
