'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Heart, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Charity, Subscription } from '@/types'

export default function CharityPage() {
  const supabase = createClient()

  const [charities, setCharities] = useState<Charity[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(10)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const [charitiesRes, subRes] = await Promise.all([
      supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false }),

      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ])

    if (charitiesRes.data) {
      setCharities(charitiesRes.data)
    }

    if (subRes.data) {
      setSubscription(subRes.data)
      setSelectedId(subRes.data.charity_id || '')
      setPercentage(subRes.data.charity_percentage || 10)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function save() {
    if (!subscription) return

    setSaving(true)

    const { error } = await supabase
      .from('subscriptions')
      .update({
        charity_id: selectedId || null,
        charity_percentage: percentage,
      })
      .eq('id', subscription.id)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  const handleDonate = async () => {
    try {
      setStripeLoading(true)

      const selectedPlan = subscription?.plan || 'monthly'

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          charity_id: selectedId,
          charity_percentage: percentage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to start Stripe checkout')
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Stripe checkout URL not received')
      }
    } catch (error) {
      console.error('Stripe checkout error:', error)
      alert('Something went wrong')
    } finally {
      setStripeLoading(false)
    }
  }

  const selected = charities.find((c) => c.id === selectedId)

  const contributionAmount = subscription
    ? Math.round((subscription.amount_pence * percentage) / 100)
    : 0

  if (loading) {
    return (
      <div className="pt-14 lg:pt-0 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-dark-700 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          My Charity
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Choose who benefits from your subscription
        </p>
      </div>

      {subscription && (
        <div className="p-5 rounded-2xl bg-pink-900/10 border border-pink-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-pink-400 fill-pink-400/20" />
            <span className="text-sm font-medium text-white">
              Your contribution this{' '}
              {subscription.plan === 'monthly' ? 'month' : 'year'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-pink-400">
              {formatCurrency(contributionAmount)}
            </span>
            <span className="text-gray-500 text-sm">
              ({percentage}% of {formatCurrency(subscription.amount_pence)})
            </span>
          </div>

          {selected && (
            <p className="text-xs text-gray-500 mt-1">→ going to {selected.name}</p>
          )}
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Contribution percentage
        </h2>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            className="flex-1 accent-pink-500"
          />

          <span className="text-2xl font-display font-bold text-pink-400 w-14 text-right">
            {percentage}%
          </span>
        </div>

        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Minimum 10%</span>
          <span>Maximum 50%</span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Choose your charity
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {charities.map((charity) => (
            <motion.button
              key={charity.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedId(charity.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-150 ${
                selectedId === charity.id
                  ? 'border-pink-500 bg-pink-900/20'
                  : 'border-dark-500 bg-dark-800 hover:border-dark-400'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-800/50 to-red-900/50 flex items-center justify-center shrink-0">
                  <Heart size={18} className="text-pink-400" />
                </div>

                {selectedId === charity.id && (
                  <CheckCircle
                    size={18}
                    className="text-pink-400 shrink-0 mt-0.5"
                  />
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">
                    {charity.name}
                  </p>

                  {charity.is_featured && (
                    <span className="text-xs bg-gold-900/30 text-gold-400 border border-gold-700/40 px-1.5 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>

                {charity.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {charity.description}
                  </p>
                )}

                {charity.total_raised > 0 && (
                  <p className="text-xs text-pink-500/70 mt-2">
                    {formatCurrency(charity.total_raised)} raised so far
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save preferences'}
        </button>

        <button
          onClick={handleDonate}
          disabled={stripeLoading || !selectedId}
          className="bg-green-500 px-6 py-3 rounded-xl font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {stripeLoading ? 'Redirecting...' : 'Donate funds'}
        </button>

        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 text-sm text-brand-400"
          >
            <CheckCircle size={16} />
            Saved!
          </motion.span>
        )}
      </div>
    </div>
  )
}