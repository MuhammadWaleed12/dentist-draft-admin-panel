// lib/supabase-admin.ts
// Server-side admin client for secure operations

import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Admin client with service role key - bypasses RLS
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Admin utilities
export const adminService = {
  // Get user profile by user ID
  async getUserProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'user' | 'admin' | 'provider') {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Get all users (admin only)
  async getAllUsers(page = 1, limit = 50) {
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    return { data, error, count }
  },

  // Delete user and profile (admin only)
  async deleteUser(userId: string) {
    // First delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId)
    
    if (profileError) return { error: profileError }
    
    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    return { error: authError }
  },

  // Bulk operations for providers
  async bulkUpsertProviders(providers: any[]) {
    const { data, error } = await supabaseAdmin
      .from('providers')
      .upsert(providers, {
        onConflict: 'place_id',
        ignoreDuplicates: false
      })
      .select('id')
    
    return { data, error }
  },

  // Clean up old/stale provider data
  async cleanupStaleProviders(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const { data, error } = await supabaseAdmin
      .from('providers')
      .delete()
      .lt('updated_at', cutoffDate.toISOString())
      .select('id')
    
    return { data, error }
  }
}