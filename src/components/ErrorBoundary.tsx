'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry/error tracking service
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
      
      // For now, log to console
      console.error('Error Details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="size-14 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-7 text-[#FF6B6B]" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-[280px]">
            An unexpected error occurred. Please try again.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
