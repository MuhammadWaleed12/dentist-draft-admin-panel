'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push('/login')
    }
  }, [user, loading, router, isPublicRoute])

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  // If it's a public route, always show content
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, only show content if user is authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}