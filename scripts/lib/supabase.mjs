import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, validateEnv } from './env.mjs';

/**
 * Create a Supabase client for scripts
 */
export function createSupabaseClient() {
  const config = getSupabaseConfig();
  
  if (!config.url) {
    throw new Error('SUPABASE_URL is not set');
  }
  if (!config.serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(config.url, config.serviceKey);
}

/**
 * Execute a SQL query and handle errors
 */
export async function queryDatabase(sql, values = []) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: sql,
    sql_params: values,
  });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

/**
 * Get table schema information
 */
export async function getTableSchema(tableName) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', tableName);

  if (error) {
    throw new Error(`Failed to get schema for ${tableName}: ${error.message}`);
  }

  return data;
}

/**
 * Safely insert records with conflict handling
 */
export async function upsertRecords(tableName, records, conflictKeys = ['id']) {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from(tableName)
    .upsert(records, { onConflict: conflictKeys.join(',') });

  if (error) {
    throw new Error(`Failed to upsert ${tableName}: ${error.message}`);
  }

  return records;
}

/**
 * Batch delete records
 */
export async function deleteRecords(tableName, condition) {
  const supabase = createSupabaseClient();
  
  let query = supabase.from(tableName).delete();
  
  // Apply conditions if provided
  for (const [key, value] of Object.entries(condition)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
  }

  return data;
}

/**
 * Safe log with timestamp
 */
export function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
    success: '[✓]',
  }[level] || '[LOG]';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

/**
 * Retry operation with exponential backoff
 */
export async function retry(fn, options = {}) {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = delayMs * Math.pow(2, attempt - 1);
      log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, 'warn');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
