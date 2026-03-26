'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-dark-900 text-white font-body min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            An unexpected error occurred. Please try again or return home.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary flex items-center gap-2">
              <RefreshCw size={16} /> Try again
            </button>
            <Link href="/" className="btn-secondary">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  )
}
