// lib/get-supabase-admin.ts
// Safe Supabase admin client factory — avoids crashing at import time

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

/**
 * Dynamically returns a Supabase admin client or null if misconfigured.
 * Safe to use in unstable routes or dev environments.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[getSupabaseAdmin] Missing Supabase env variables');
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
