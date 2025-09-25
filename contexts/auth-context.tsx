'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AuthUser extends User {
  role?: 'provider'
  profile?: any
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signInWithPhone: (phone: string) => Promise<{ data?: any; error?: any }>
  verifyOtp: (phone: string, otp: string) => Promise<{ data?: any; error?: any }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isVerified: boolean | null
  verificationStatus: 'loading' | 'verified' | 'unverified' | 'not_found'
  refreshVerificationStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'unverified' | 'not_found'>('loading')
  const router = useRouter()
  
  const supabase = createSupabaseClient()
  console.log(supabase)

// Add this function to test Supabase connectivity
const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    console.log('🧪 Connection test result:', { data, error })
    return !error
  } catch (error) {
    console.error('🧪 Connection test failed:', error)
    return false
  }
}

  // 🆕 ONLY ADDITION: Function to create profile (only if doesn't exist)
  const createOrUpdateProfile = async (user: User) => {
    try {
      console.log('👤 Checking if profile exists for phone:', user.phone)
      console.log('📱 User ID:', user.id)
      
      // Check if profile already exists by phone number
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', user.phone)
        .maybeSingle()

      console.log('🔍 Existing profile check (by phone):', { existingProfile, fetchError })

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error checking existing profile:', fetchError)
        throw fetchError
      }

      if (existingProfile) {
        console.log('✅ Profile already exists for this phone, skipping creation:', existingProfile.id)
        return { data: existingProfile, error: null }
      }

      // Profile doesn't exist for this phone, create new one
      const profileData = {
        user_id: user.id,
        phone: user.phone || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        role: 'user' as const,
        is_verified: false, // Admin manually verifies in dashboard
      }

      console.log('📝 Creating new profile with data:', profileData)

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating profile:', createError)
        throw createError
      }

      console.log('✅ New profile created successfully:', newProfile)
      return { data: newProfile, error: null }

    } catch (error) {
      console.error('💥 Error in createOrUpdateProfile:', error)
      return { data: null, error }
    }
  }

  // Function to check user verification status based on phone
  const checkUserVerification = async (phone: string) => {
    debugger
    console.log('🔍 Checking verification for phone:', phone)
    console.log('🧪 Testing Supabase connection...')
    const connectionTest = await supabase.from('profiles').select('count').limit(1)
    console.log('🧪 Connection test result:', connectionTest)
    try {
      setVerificationStatus('loading')
      debugger
      // Check if user has a profile and is verified
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_verified, role')
        .eq('phone', phone)
        .maybeSingle()

      console.log('📊 Profile verification result:', { profile, error })

      if (error || !profile) {
        console.log('❌ Profile not found for phone:', phone, error?.message)
        setVerificationStatus('not_found')
        setIsVerified(false)
        return { verified: false, status: 'not_found' }
      }

      if (profile?.is_verified) {
        console.log('✅ User is verified')
        setVerificationStatus('verified')
        setIsVerified(true)
        return { verified: true, status: 'verified' }
      } else {
        console.log('⏳ User is unverified')
        setVerificationStatus('unverified')
        setIsVerified(false)
        return { verified: false, status: 'unverified' }
      }
    } catch (error) {
      console.error('💥 Error checking user verification:', error)
      setVerificationStatus('not_found')
      setIsVerified(false)
      return { verified: false, status: 'error' }
    }
  }

  // Refresh verification status
  const refreshVerificationStatus = async () => {
    if (user?.phone) {
      await checkUserVerification(user.phone)
    }
  }

  // Clear all auth state
  const clearAuthState = () => {
    console.log('🧹 Clearing auth state...')
    setUser(null)
    setSession(null)
    setIsVerified(null)
    setVerificationStatus('loading')
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user as AuthUser || null)
          
          if (session?.user?.phone) {
            const verificationResult = await checkUserVerification(session.user.phone)
            
            // Don't redirect if user is already on auth pages
            const currentPath = window.location.pathname
            const authPages = ['/login', '/auth/callback']
            
            if (!authPages.includes(currentPath)) {
              console.log('🔄 Redirecting user to provider profile')
              router.push('/provider-profile')
            }
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.phone)
        
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out - clearing state and redirecting')
          clearAuthState()
          toast.info('Signed out successfully')
          const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/') {
        router.push('/login')
      }
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user as AuthUser || null)
        
        if (session?.user?.phone) {
          if (event === 'SIGNED_IN') {
            debugger
            console.log('👋 User signed in - checking verification')
            
            // 🆕 ONLY ADDITION: Create profile after sign in
            await createOrUpdateProfile(session.user)
            
            // Check verification status after sign in
            await checkUserVerification(session.user.phone)
           
            router.push('/provider-profile')
          } 
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase.auth])

  // Sign in with phone - CORRECTED based on official docs
  const signInWithPhone = async (phone: string) => {
    setLoading(true)
    try {
      console.log('📱 Sending OTP to:', phone)
      
      // Official Supabase method from docs
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true,
        }
      })

      console.log('📤 signInWithOtp result:', { data, error })

      if (error) {
        console.error('❌ Error sending OTP:', error)
        toast.error(error.message || 'Failed to send verification code')
        return { data: null, error }
      }

      console.log('✅ OTP sent successfully')
      toast.success('Verification code sent to your phone!')
      return { data, error: null }
    } catch (error) {
      console.error('💥 Unexpected error in signInWithPhone:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP - CORRECTED based on official docs + PROFILE CREATION
  const verifyOtp = async (phone: string, otp: string) => {
    setLoading(true)
    try {
      console.log('🔐 Verifying OTP:', { phone, otp: otp.length })
      debugger
      // Official Supabase method from docs - NOTE: phone without + prefix
      const phoneWithoutPlus = phone.replace('+', '')
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneWithoutPlus, // Remove + prefix as per docs
        token: otp,
        type: 'sms'
      })

      console.log('🔐 verifyOtp result:', { data, error })

      if (error) {
        console.error('❌ OTP verification failed:', error)
        toast.error(error.message || 'Invalid verification code')
        return { data: null, error }
      }

      // 🆕 ONLY ADDITION: Create profile only if doesn't exist
      if (data.user) {
        console.log('👤 Checking/creating profile after successful OTP verification')
        
        const profileResult = await createOrUpdateProfile(data.user)
        
        if (profileResult.error) {
          console.error('❌ Failed to create profile:', profileResult.error)
          // Don't fail the auth, just log the error
          toast.error('Authentication successful, but failed to create profile')
        } else if (profileResult.data) {
          console.log('✅ Profile ready:', profileResult.data.id)
        }
      }

      console.log('✅ OTP verified successfully')
      toast.success('Phone number verified successfully!')
      return { data, error: null }
    } catch (error) {
      console.error('💥 Unexpected error in verifyOtp:', error)
      toast.error('An unexpected error occurred')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // const signOut = async () => {
  //   console.log('💥 Signing out...')
  //   setLoading(true)
    
  //   try {
  //     console.log('🗑️ Clearing all state...')
      
  //     // Clear auth state
  //     setUser(null)
  //     setSession(null)
  //     setIsVerified(null)
  //     setVerificationStatus('loading')
      
  //     // Clear all storage
  //     localStorage.clear()
  //     sessionStorage.clear()
  //     setLoading(false)
    
  //     // Sign out from Supabase
  //     const { error } = await supabase.auth.signOut()
  //     if (error) {
  //       throw error
  //     }  
  //     console.log('🔄 Redirect to login...')
  //     router.push('/login')
      
  //     toast.success('Signed out successfully')
      
   
      
  //   } catch (error) {
  //     console.error('Signout failed:', error)
  //     // Force page reload as last resort
  //     window.location.href = '/login'
  //   } 
  // }
  const signOut = async () => {
    console.log('💥 Starting complete sign out process...')
    setLoading(true)
    
    try {
      // Step 1: Clear all React state immediately
      console.log('🗑️ Clearing all React state...')
      setUser(null)
      setSession(null)
      setIsVerified(null)
      setVerificationStatus('loading')
      
      // Step 2: Sign out from Supabase FIRST (most important)
      console.log('🔐 Signing out from Supabase...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        // Continue with cleanup even if there's an error
      } else {
        console.log('✅ Supabase signOut successful')
      }
      
      // Step 3: Clear all browser storage
      console.log('🧹 Clearing browser storage...')
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (storageError) {
        console.warn('⚠️ Storage clearing error (non-critical):', storageError)
      }
      
      // Step 4: Clear cookies manually
      console.log('🍪 Clearing auth cookies...')
      try {
        // Get all cookies and clear Supabase-related ones
        const cookies = document.cookie.split(';')
        
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          
          // Clear any Supabase auth cookies
          if (name.includes('sb-') || name.includes('supabase') || name.includes('auth')) {
            // Clear for current domain
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            // Clear for parent domain  
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
            // Clear for specific domain
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          }
        })
      } catch (cookieError) {
        console.warn('⚠️ Cookie clearing error (non-critical):', cookieError)
      }
      
      // Step 5: Force a fresh session check
      console.log('🔌 Forcing session refresh...')
      await supabase.auth.getSession()
      
      // Step 6: Show success message
      toast.success('Signed out successfully')
      
      console.log('✅ Sign out completed successfully')
      
    } catch (error) {
      console.error('💥 SignOut error:', error)
      
      // Even if there's an error, clear local state
      setUser(null)
      setSession(null)
      setIsVerified(null)
      setVerificationStatus('loading')
      
      toast.info('Signed out')
    } finally {
      setLoading(false)
    }
  }
  const value = {
    user,
    session,
    loading,
    signInWithPhone,
    verifyOtp,
    signOut,
    isAuthenticated: !!user,
    isVerified,
    verificationStatus,
    refreshVerificationStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}