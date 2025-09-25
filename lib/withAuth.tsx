import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

interface WithAuthOptions {
  redirectTo?: string
  requireAuth?: boolean
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/login',
    requireAuth = true,
  } = options

  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (requireAuth && !isAuthenticated) {
          // User needs to be authenticated but isn't
          router.push(redirectTo)
        } else if (!requireAuth && isAuthenticated) {
            debugger
          // User shouldn't be authenticated but is (like login page)
          router.push('/provider-profile')
        }
      }
    }, [isAuthenticated, loading, router])

    // Show loading spinner while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    // Don't render anything while redirecting
    if (requireAuth && !isAuthenticated) {
      return null
    }

    if (!requireAuth && isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

// Helper function for pages that require authentication
export const requireAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requireAuth: true })

// Helper function for pages that should redirect if authenticated (like login)
export const redirectIfAuthenticated = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { requireAuth: false })