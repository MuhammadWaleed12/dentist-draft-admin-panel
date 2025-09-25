import { createSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Define custom user metadata interface
export interface CustomUserMetadata {
  full_name?: string
  avatar_url?: string
  provider?: string
  [key: string]: any
}

// Use intersection type instead of extending to avoid conflicts
export type AuthUser = User & {
  user_metadata: CustomUserMetadata
}

export const authService = {
  // Sign in with email/password
  async signInWithEmail(email: string, password: string) {
    const supabase = createSupabaseClient()
    
    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        // If successful or non-rate-limit error, return immediately
        if (!error || !error.message.includes('rate limit')) {
          return { data, error };
        }
        
        // If rate limited, wait and retry
        if (retryCount < maxRetries - 1) {
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
        } else {
          return { data, error };
        }
      } catch (err) {
        return { data: null, error: err };
      }
    }
    
    // This should never be reached, but just in case
    return { data: null, error: new Error('Max retries exceeded') };
  },

  // Sign up with email/password
  async signUpWithEmail(email: string, password: string, fullName?: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      // If successful and user is created, create a profile
      if (data.user && !error) {
        await this.createUserProfile(data.user.id, {
          full_name: fullName,
          user_id: data.user.id,
        })
      }

      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Sign in with OAuth providers
  async signInWithProvider(provider: 'google') {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
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

  // Get current user
  async getCurrentUser() {
    const supabase = createSupabaseClient()
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    } catch (err) {
      return { user: null, error: err }
    }
  },

  // Get session
  async getSession() {
    const supabase = createSupabaseClient()
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (err) {
      return { session: null, error: err }
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createSupabaseClient()
    return supabase.auth.onAuthStateChange(callback)
  },

  // Helper method to create user profile
  async createUserProfile(userId: string, profileData: { full_name?: string; user_id: string }) {
    const supabase = createSupabaseClient()
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: profileData.full_name,
          role: 'user',
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
      return { error }
    } catch (err) {
      console.error('Error creating user profile:', err)
      return { error: err }
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Update password
  async updatePassword(password: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Update user metadata
  async updateUserMetadata(metadata: any) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Verify OTP (for email verification)
  async verifyOtp(email: string, token: string, type: 'signup' | 'recovery') {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  // Resend confirmation email
  async resendConfirmation(email: string) {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  },
}