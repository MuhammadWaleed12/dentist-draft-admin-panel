'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, Mail } from 'lucide-react'
import LogoIcon from '@/assets/Icons/LogoIcon'

interface ProviderAuthGuardProps {
  children: React.ReactNode
}

export function ProviderAuthGuard({ children }: ProviderAuthGuardProps) {
  const { user, loading, isVerified, verificationStatus, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show verification pending message for unverified providers
  if (verificationStatus === 'unverified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <LogoIcon />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Verification Pending
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Your provider account is awaiting verification
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Account Under Review</p>
                    <p>
                      We're currently verifying your dental practice credentials. 
                      This process typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What happens next:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    Our team reviews your practice information
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    We verify your dental license and credentials
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Need Help?</p>
                    <p>
                      Contact our support team at{' '}
                      <a href="mailto:support@dentistarguide.com" className="underline">
                        support@dentistarguide.com
                      </a>{' '}
                      if you have any questions about the verification process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show provider not found message
  if (verificationStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <LogoIcon />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Account Not Found
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  No provider account found for this email
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Subscription Required</p>
                  <p>
                    This portal is for subscribed dental providers only. 
                    Please contact us to subscribe to DentiStar Guide services.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('mailto:sales@dentistarguide.com', '_blank')}
                >
                  Contact Sales
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render protected content for verified providers only
  if (verificationStatus === 'verified' && isVerified) {
    return <>{children}</>
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
