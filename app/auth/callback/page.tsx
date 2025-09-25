'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import LogoIcon from '@/assets/Icons/LogoIcon'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Completing sign in...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createSupabaseClient()

      try {
        // ✅ Ignore TypeScript warning here
        // @ts-ignore
        const { data, error } = await supabase.getSession()
debugger
        if (error) {
          console.error('OAuth callback error:', error)
          toast.error('Sign-in failed. Please try again.')
          router.push('/login')
          return
        }

        if (!data?.session?.user) {
          toast.error('No session found. Please log in again.')
          router.push('/login')
          return
        }

        setMessage('Sign-in successful! Redirecting...')
        router.push('/provider-profile')
      } catch (err: any) {
        console.error('Unexpected error in auth callback:', err)
        toast.error(err.message || 'Authentication failed.')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="mx-auto"><LogoIcon /></div>
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-100" />
          <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse delay-200" />
        </div>
        <p className="text-sm text-gray-500 max-w-md">
          Setting up your provider account. This may take a few moments.
        </p>
      </div>
    </div>
  )
}
