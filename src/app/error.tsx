'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="size-16 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-4">
        <AlertTriangle className="size-8 text-[#FF6B6B]" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white">
        Try Again
      </Button>
    </div>
  )
}
