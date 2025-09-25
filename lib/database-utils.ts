// lib/database-utils.ts
// Utility functions for database operations with proper error handling

import { createSupabaseClient } from './supabase'
import { Provider } from './types'

// Geospatial utilities
const geoUtils = {
  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  // Create bounding box for efficient spatial queries
  createBoundingBox(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 111.32 // 1 degree lat ≈ 111.32 km
    const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))
    
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta
    }
  },

  // Optimized spatial query using bounding box
  async getProvidersInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusKm: number,
    options: {
      type?: 'dentist' | 'cosmetic'
      limit?: number
      offset?: number
    } = {}
  ) {
    const supabase = createSupabaseClient()
    const { minLat, maxLat, minLng, maxLng } = this.createBoundingBox(centerLat, centerLng, radiusKm)
    
    let query = supabase
      .from('providers')
      .select('*')
      .gte('lat', minLat)
      .lte('lat', maxLat)
      .gte('lng', minLng)
      .lte('lng', maxLng)
    
    if (options.type) {
      query = query.eq('type', options.type)
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error } = await query
    
    if (error) return { data: null, error }
    
    // Filter by exact distance and add distance field
    const providersWithDistance = data
      ?.map(provider => ({
        ...provider,
        distance: this.calculateDistance(centerLat, centerLng, provider.lat, provider.lng)
      }))
      .filter(provider => provider.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance) || []
    
    return { data: providersWithDistance, error: null }
  }
}

// Cache utilities
const cacheUtils = {
  // Check if location data is fresh
  isLocationDataFresh(lastSearched: string, maxAgeHours = 24): boolean {
    const lastSearchDate = new Date(lastSearched)
    const now = new Date()
    const ageHours = (now.getTime() - lastSearchDate.getTime()) / (1000 * 60 * 60)
    return ageHours < maxAgeHours
  },

  // Get cached location data
  async getCachedLocation(city: string, state: string, country = 'US') {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('city', city)
      .eq('state', state)
      .eq('country', country)
      .single()
    
    return { data, error }
  },

  // Update location cache
  async updateLocationCache(locationData: {
    city: string
    state: string
    country?: string
    lat: number
    lng: number
    provider_count: number
  }) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .upsert({
        ...locationData,
        country: locationData.country || 'US',
        last_searched: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'city,state,country'
      })
      .select()
      .single()
    
    return { data, error }
  }
}

// Provider utilities
const providerUtils = {
  // Safely upsert providers with conflict resolution
  async upsertProviders(providers: Partial<Provider>[]) {
    const supabase = createSupabaseClient()
    const providersToInsert = providers.map(provider => ({
      id: provider.id || crypto.randomUUID(),
      name: provider.name || 'Unknown Provider',
      type: provider.type || 'dentist',
      address: provider.address || '',
      lat: provider.lat || 0,
      lng: provider.lng || 0,
      rating: provider.rating || 0,
      review_count: provider.reviewCount || 0,
      tags: provider.tags || [],
      phone_number: provider.phoneNumber || '',
      website: provider.website || '',
      photos: provider.photos || [],
      business_status: 'OPERATIONAL',
      place_id: provider.id,
      last_verified: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('providers')
      .upsert(providersToInsert, {
        onConflict: 'place_id',
        ignoreDuplicates: false
      })
      .select('id')
    
    return { data, error }
  },

  // Get provider by place_id (Google Places ID)
  async getProviderByPlaceId(placeId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('place_id', placeId)
      .single()
    
    return { data, error }
  },

  // Update provider verification status
  async updateProviderVerification(providerId: string, isVerified = true) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('providers')
      .update({
        last_verified: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)
      .select()
      .single()
    
    return { data, error }
  }
}

// User utilities
export const userUtils = {
  // Get user profile with error handling
  async getUserProfile(userId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    full_name?: string
    avatar_url?: string
    role?: 'user' | 'admin' | 'provider'
  }) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Check if user has admin role
  async isUserAdmin(userId: string): Promise<boolean> {
    const { data } = await this.getUserProfile(userId)
    return data?.role === 'admin'
  },

  // Check if user has provider role
  async isUserProvider(userId: string): Promise<boolean> {
    const { data } = await this.getUserProfile(userId)
    return data?.role === 'provider'
  }
}

// Error handling utilities
export const errorUtils = {
  // Handle Supabase errors gracefully
  handleSupabaseError(error: any): string {
    if (!error) return 'Unknown error occurred'
    
    // Common Supabase error codes
    const errorMessages: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Referenced record not found',
      '42501': 'Permission denied',
      'PGRST116': 'No rows found',
      'PGRST301': 'Row level security violation'
    }
    
    const code = error.code || error.error_code
    if (code && errorMessages[code]) {
      return errorMessages[code]
    }
    
    return error.message || 'Database operation failed'
  },

  // Log errors with context
  logError(operation: string, error: any, context?: any) {
    console.error(`[${operation}] Error:`, {
      error: error.message || error,
      code: error.code || error.error_code,
      context,
      timestamp: new Date().toISOString()
    })
  }
}