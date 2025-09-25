// lib/admin-auth.ts
// Admin authentication utilities

import { createSupabaseClient } from '@/lib/supabase'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  is_verified: boolean
}

export const adminAuth = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('No user data returned')
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_verified, full_name, email')
        .eq('user_id', data.user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found')
      }

      if (profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }

      if (!profile.is_verified) {
        await supabase.auth.signOut()
        throw new Error('Admin account not verified. Contact system administrator.')
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || profile.email || '',
          full_name: profile.full_name,
          role: profile.role,
          is_verified: profile.is_verified
        },
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Login failed')
      }
    }
  },

  // Get current admin user
  async getCurrentAdminUser(): Promise<AdminUser | null> {
    const supabase = createSupabaseClient()
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_verified, full_name, email')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin' || !profile.is_verified) {
        return null
      }

      return {
        id: user.id,
        email: user.email || profile.email || '',
        full_name: profile.full_name,
        role: profile.role,
        is_verified: profile.is_verified
      }
    } catch (error) {
      console.error('Error getting current admin user:', error)
      return null
    }
  },

  // Sign out
  async signOut() {
    const supabase = createSupabaseClient()
    
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      return { error: err }
    }
  },

  // Check if current user is admin
  async isCurrentUserAdmin(): Promise<boolean> {
    const adminUser = await this.getCurrentAdminUser()
    return !!adminUser
  }
}