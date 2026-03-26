'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/subscribe'

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div
      className="w-full max-w-md"
    >
      <div className="card p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to your GreenGive account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Password</label>
              <Link href="#" className="text-xs text-brand-500 hover:text-brand-400 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                className="input pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-dark-700/50 border border-dark-500">
          <p className="text-xs text-gray-500 font-medium mb-2">Test credentials (evaluators)</p>
          <p className="text-xs text-gray-400">User: <span className="text-gray-300">user@test.com / test123456</span></p>
          <p className="text-xs text-gray-400">Admin: <span className="text-gray-300">admin@test.com / admin123456</span></p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          New to GreenGive?{' '}
          <Link href="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}


export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
