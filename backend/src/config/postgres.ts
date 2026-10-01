import { Pool } from 'pg';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let pool: Pool | null = null;

export function isPostgresConfigured(): boolean {
  return Boolean(config.DATABASE_URL && config.DATABASE_URL.startsWith('postgresql://'));
}

export function getPostgresPool(): Pool | null {
  if (!isPostgresConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
    });
  }
  return pool;
}
