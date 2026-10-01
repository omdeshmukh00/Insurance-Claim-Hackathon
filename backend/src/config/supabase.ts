import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let supabaseAdminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_URL.startsWith('http') &&
    config.SUPABASE_SECRET_KEY &&
    config.SUPABASE_SECRET_KEY !== 'your-supabase-service-role-key'
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    if (!isSupabaseConfigured()) {
      logger.warn('Supabase credentials not configured or using default placeholders. Using mock/local repository fallback.');
    }
    supabaseAdminClient = createClient(
      config.SUPABASE_URL || 'https://placeholder.supabase.co',
      config.SUPABASE_SECRET_KEY || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminClient;
}

export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(
    config.SUPABASE_URL || 'https://placeholder.supabase.co',
    config.SUPABASE_SECRET_KEY || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}
