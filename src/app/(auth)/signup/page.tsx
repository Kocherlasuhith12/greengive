'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/types'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = searchParams.get('plan') as 'monthly' | 'yearly' | null

  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    plan: (planFromUrl || 'monthly') as 'monthly' | 'yearly',
    charity_id: '',
    charity_percentage: 10,
  })

  const [charities, setCharities] = useState<
    { id: string; name: string; is_featured: boolean }[]
  >([])

  useEffect(() => {
    supabase
      .from('charities')
      .select('id, name, is_featured')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setCharities(data)
      })
  }, [supabase])

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
        },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('Signup failed — no user returned')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) throw signInError

      const params = new URLSearchParams({
        plan: form.plan,
        charity_id: form.charity_id,
        charity_percentage: String(form.charity_percentage),
      })

      router.push(`/subscribe?${params.toString()}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            Create your account
          </h1>
          <p className="text-gray-400 text-sm">
            Join GreenGive and start making an impact
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s
                    ? 'bg-brand-500 text-dark-900'
                    : 'bg-dark-600 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              <span
                className={`text-xs ${step >= s ? 'text-white' : 'text-gray-600'}`}
              >
                {s === 1 ? 'Account' : 'Plan & Charity'}
              </span>
              {s < 2 && <div className="w-8 h-px bg-dark-600 ml-1" />}
            </div>
          ))}
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Your name"
                  required
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input pr-12"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
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

              <button type="submit" className="btn-primary w-full justify-center mt-2">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="label">Choose your plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['monthly', 'yearly'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update('plan', p)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.plan === p
                          ? 'border-brand-500 bg-brand-900/20'
                          : 'border-dark-500 hover:border-dark-400'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white capitalize">
                        {p}
                      </div>
                      <div className="text-lg font-display font-bold text-brand-400 mt-1">
                        {PLANS[p].label}
                      </div>
                      {p === 'yearly' && (
                        <div className="text-xs text-gold-400 mt-1">Save 25%</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1">
                  <Heart size={14} className="text-pink-500" /> Select your charity
                </label>
                <select
                  className="input"
                  value={form.charity_id}
                  onChange={(e) => update('charity_id', e.target.value)}
                >
                  <option value="">-- Choose a charity --</option>
                  {charities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.is_featured ? ' ⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Charity contribution:{' '}
                  <span className="text-brand-400 font-semibold">
                    {form.charity_percentage}%
                  </span>
                  <span className="text-gray-600 ml-1">(minimum 10%)</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={form.charity_percentage}
                  onChange={(e) =>
                    update('charity_percentage', parseInt(e.target.value))
                  }
                  className="w-full accent-brand-500 mt-2"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 justify-center"
                >
                  {loading ? 'Creating account…' : 'Continue to payment'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  )
}