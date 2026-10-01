import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  logger.error(`Unhandled error during request [${req.method} ${req.originalUrl}]`, {
    requestId,
    error: err.message,
    name: err.name,
    code: err.code,
    stack: config.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    sendError(res, 'VALIDATION_ERROR', 'Request validation failed', 400, err.format());
    return;
  }

  // Handle Domain AppError
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    sendError(res, 'UPLOAD_ERROR', err.message, 400);
    return;
  }

  // Fallback internal error
  const message = config.NODE_ENV === 'production'
    ? 'An unexpected internal error occurred'
    : err.message || 'Internal server error';

  sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
}
