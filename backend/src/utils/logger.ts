import { config } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function redactSensitive(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitive);

  const redacted: Record<string, any> = {};
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apikey', 'authorization', 'smtp_password'];

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const logger = {
  debug(message: string, context?: Record<string, any>) {
    if (LOG_LEVELS[config.LOG_LEVEL] <= LOG_LEVELS.debug) {
      console.debug(JSON.stringify({ level: 'DEBUG', timestamp: new Date().toISOString(), message, ...(context ? redactSensitive(context) : {}) }));
    }
  },
  info(message: string, context?: Record<string, any>) {
    if (LOG_LEVELS[config.LOG_LEVEL] <= LOG_LEVELS.info) {
      console.info(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...(context ? redactSensitive(context) : {}) }));
    }
  },
  warn(message: string, context?: Record<string, any>) {
    if (LOG_LEVELS[config.LOG_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...(context ? redactSensitive(context) : {}) }));
    }
  },
  error(message: string, context?: Record<string, any>) {
    if (LOG_LEVELS[config.LOG_LEVEL] <= LOG_LEVELS.error) {
      console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message, ...(context ? redactSensitive(context) : {}) }));
    }
  },
};
