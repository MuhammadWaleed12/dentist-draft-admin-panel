// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Admin Supabase client (bypasses RLS using service role)
export const createAdminSupabaseClient = () => {
  if (!supabaseServiceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json } 
  | Json[]

export interface Database {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string
          name: string
          type: 'dentist' | 'cosmetic'
          address: string
          lat: number
          lng: number
          rating: number
          review_count: number
          tags: string[]
          phone_number: string | null
          website: string | null
          photos: string[]
          opening_hours: Json | null
          business_status: string
          place_id: string | null
          user_id: string | null
          email: string | null
          zip_code: string | null
          created_at: string
          updated_at: string
          last_verified: string
        }
        Insert: {
          id: string
          name: string
          type: 'dentist' | 'cosmetic'
          address: string
          lat: number
          lng: number
          rating?: number
          review_count?: number
          tags?: string[]
          phone_number?: string | null
          website?: string | null
          photos?: string[]
          opening_hours?: Json | null
          business_status?: string
          place_id?: string | null
          user_id?: string | null
          email?: string | null
          zip_code?: string | null
          last_verified?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'dentist' | 'cosmetic'
          address?: string
          lat?: number
          lng?: number
          rating?: number
          review_count?: number
          tags?: string[]
          phone_number?: string | null
          website?: string | null
          photos?: string[]
          opening_hours?: Json | null
          business_status?: string
          place_id?: string | null
          user_id?: string | null
          email?: string | null
          zip_code?: string | null
          last_verified?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          provider_id: string
          name: string
          email: string
          phone: string
          address: string
          appointment_date: string | null
          appointment_time: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          provider_id: string
          name: string
          email: string
          phone: string
          address: string
          appointment_date?: string | null
          appointment_time?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
        Update: {
          provider_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          appointment_date?: string | null
          appointment_time?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          email: string | null
          role: 'user' | 'admin' | 'provider'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          role?: 'user' | 'admin' | 'provider'
          is_verified?: boolean
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          email?: string | null
          role?: 'user' | 'admin' | 'provider'
          is_verified?: boolean
          updated_at?: string
        }
      }
    }
  }
}