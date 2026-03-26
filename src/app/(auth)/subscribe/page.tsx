'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SubscribePage() {
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState(
    searchParams.get('plan') || 'monthly'
  )

  const [selectedCharity, setSelectedCharity] = useState(
    searchParams.get('charity_id') || ''
  )

  const [charityPercentage, setCharityPercentage] = useState(
    Number(searchParams.get('charity_percentage') || 10)
  )

  const handleSubscribe = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          charity_id: selectedCharity,
          charity_percentage: charityPercentage,
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
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Complete your payment</h1>
        <p className="text-gray-400 mt-2">
          Choose your plan and continue to Stripe.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={`p-4 rounded-xl border text-left ${
            selectedPlan === 'monthly'
              ? 'border-pink-500 bg-pink-900/20'
              : 'border-dark-500 bg-dark-800'
          }`}
        >
          <div className="text-sm text-white font-semibold">Monthly</div>
        </button>

        <button
          onClick={() => setSelectedPlan('yearly')}
          className={`p-4 rounded-xl border text-left ${
            selectedPlan === 'yearly'
              ? 'border-pink-500 bg-pink-900/20'
              : 'border-dark-500 bg-dark-800'
          }`}
        >
          <div className="text-sm text-white font-semibold">Yearly</div>
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <p>Selected charity: {selectedCharity || 'Not selected'}</p>
        <p>Charity percentage: {charityPercentage}%</p>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="rounded-xl bg-green-500 px-5 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : 'Continue to payment'}
      </button>
    </div>
  )
}