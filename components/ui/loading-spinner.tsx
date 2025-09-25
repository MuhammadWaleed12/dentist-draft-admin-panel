import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className={cn(
          'animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4',
          sizeClasses[size],
          className
        )} />
        <div className="text-gray-600">
          <h3 className="text-lg font-medium mb-2">Loading...</h3>
          <p className="text-sm">Please wait while we load your content</p>
        </div>
      </div>
    </div>
  )
}