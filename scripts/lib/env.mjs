import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

/**
 * Load environment variables from .env.local or .env
 * Priority: .env.local > .env > process.env
 */
export function loadEnv() {
  dotenv.config({ path: path.join(projectRoot, '.env.local') });
  dotenv.config({ path: path.join(projectRoot, '.env') });
  return process.env;
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig() {
  const env = loadEnv();
  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Validate required environment variables
 */
export function validateEnv(required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  const env = loadEnv();
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return env;
}
