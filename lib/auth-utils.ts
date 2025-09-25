// lib/auth-utils.ts
// Utilities for accessing Supabase auth data

import { createSupabaseClient } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface AuthUserWithProfile {
  // From auth.users table
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  updated_at: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
    provider?: string
    [key: string]: any
  }
  
  // From profiles table
  profile: {
    id: string
    user_id: string
    full_name: string | null
    avatar_url: string | null
    role: 'user' | 'admin' | 'provider'
    created_at: string
    updated_at: string
  } | null
}

// Helper function to convert undefined to null
const undefinedToNull = (value: string | undefined | null): string | null => {
  return value === undefined ? null : value
}

// Helper function to ensure string values (fallback to empty string)
const ensureString = (value: string | undefined | null): string => {
  return value || ''
}

export const authUtils = {
  // Get current user with profile (client-side)
  async getCurrentUserWithProfile(): Promise<AuthUserWithProfile | null> {
    const supabaseClient = createSupabaseClient()
    
    // Get auth user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return null
    }

    // Get profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    return {
      id: user.id,
      email: ensureString(user.email),
      email_confirmed_at: undefinedToNull(user.email_confirmed_at),
      created_at: ensureString(user.created_at),
      updated_at: ensureString(user.updated_at),
      user_metadata: user.user_metadata || {},
      profile: profile || null
    }
  },

  // Get user by ID with profile (server-side admin only)
  async getUserWithProfileById(userId: string): Promise<AuthUserWithProfile | null> {
    try {
      // Get auth user (admin only)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (authError || !authUser.user) {
        console.error('Auth error:', authError)
        return null
      }

      // Get profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
      }

      const user = authUser.user
      return {
        id: user.id,
        email: ensureString(user.email),
        email_confirmed_at: undefinedToNull(user.email_confirmed_at),
        created_at: ensureString(user.created_at),
        updated_at: ensureString(user.updated_at),
        user_metadata: user.user_metadata || {},
        profile: profile || null
      }
    } catch (error) {
      console.error('Error getting user with profile:', error)
      return null
    }
  },

  // Get all users with profiles (admin only)
  async getAllUsersWithProfiles(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit

      // Get auth users (admin only)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: limit
      })

      if (authError || !authData.users) {
        console.error('Auth error:', authError)
        return { users: [], total: 0 }
      }

      // Get all profiles
      const userIds = authData.users.map(user => user.id)
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      if (profileError) {
        console.error('Profile error:', profileError)
      }

      // Combine auth users with profiles
      const usersWithProfiles: AuthUserWithProfile[] = authData.users.map(user => {
        const profile = profiles?.find(p => p.user_id === user.id) || null
        
        return {
          id: user.id,
          email: ensureString(user.email),
          email_confirmed_at: undefinedToNull(user.email_confirmed_at),
          created_at: ensureString(user.created_at),
          updated_at: ensureString(user.updated_at),
          user_metadata: user.user_metadata || {},
          profile
        }
      })

      return {
        users: usersWithProfiles,
        total: authData.total || 0
      }
    } catch (error) {
      console.error('Error getting all users with profiles:', error)
      return { users: [], total: 0 }
    }
  },

  // Update user email (admin only)
  async updateUserEmail(userId: string, newEmail: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail
      })

      return { data, error }
    } catch (error) {
      console.error('Error updating user email:', error)
      return { data: null, error }
    }
  },

  // Reset user password (admin only)
  async resetUserPassword(userId: string, newPassword: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      return { data, error }
    } catch (error) {
      console.error('Error resetting user password:', error)
      return { data: null, error }
    }
  },

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error || !data.users) {
        return false
      }

      return data.users.some(user => user.email === email)
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  },

  // Create user profile (helper method)
  async createUserProfile(userId: string, profileData: {
    full_name?: string
    avatar_url?: string
    role?: 'user' | 'admin' | 'provider'
  }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: profileData.full_name || null,
          avatar_url: profileData.avatar_url || null,
          role: profileData.role || 'user'
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating user profile:', error)
      return { data: null, error }
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    full_name?: string | null
    avatar_url?: string | null
    role?: 'user' | 'admin' | 'provider'
  }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { data: null, error }
    }
  },

  // Delete user and profile (admin only)
  async deleteUser(userId: string) {
    try {
      // Delete profile first (due to foreign key constraint)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId)

      if (profileError) {
        console.error('Error deleting profile:', profileError)
      }

      // Delete auth user
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

      return { data, error }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { data: null, error }
    }
  }
}