import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId: string;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const requestId = (res.req as any).id || (res.getHeader('X-Request-Id') as string) || 'unknown';
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
    requestId,
  };
  return res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: any
): Response {
  const requestId = (res.req as any).id || (res.getHeader('X-Request-Id') as string) || 'unknown';
  const responsePayload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    requestId,
  };
  return res.status(statusCode).json(responsePayload);
}
