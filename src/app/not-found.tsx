import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-display font-bold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-flex">Back to home</Link>
      </div>
    </div>
  )
}
