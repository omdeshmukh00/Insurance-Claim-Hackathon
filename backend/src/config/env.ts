import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api'),

  // Supabase
  SUPABASE_URL: z.string().default(''),
  SUPABASE_SECRET_KEY: z.string().default(''),
  DATABASE_URL: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('claim-documents'),

  // Gemini API
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),

  // SMTP Gmail
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(true),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  EMAIL_FROM_NAME: z.string().default('AI Claims Intelligence'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration in production');
    }
    // In dev/test, fallback with defaults
    return envSchema.parse({});
  }
  return result.data;
}

export const config = parseEnv();
