'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function SubscribeContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'monthly')
  const [selectedCharity] = useState(searchParams.get('charity_id') || '')
  const [charityPercentage] = useState(Number(searchParams.get('charity_percentage') || 10))

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, charity_id: selectedCharity, charity_percentage: charityPercentage }),
      })
      const data = await res.json()
      if (data.url) win      if (data.url) win      if (data.url) win Stripe checkout URL not received')
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold text-white">Complete your payment</h1>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setSelectedPlan('monthly')} className={`p-4 rounded-xl border text-left ${selectedPlan === 'monthly' ? 'border-pink-500 bg-pink-900/20' : 'border-dark-500 bg-dark-800'}`}>
          <div className="text-sm text-white font-semibold">Monthly</div>
        </button>
        <button onClick={() => setSelectedPlan('yearly')} className={`p-4 rounded-xl border text-left ${selectedPlan === 'yearly' ? 'border-pink-500 bg-pink-900/20' : 'border-dark-500 bg-dark-800'}`}>
          <div className="text-sm text-white font-semibold">Yearly</div>
        </button>
      </div>
      <button onClick={handleSubscribe} disabled={loading} className="rounded-xl bg-green-500 px-5 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50">
        {loading ? 'Redirecting...' : 'Continue to payment'}
      </button>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white py-10 text-center">Loading...</div>}>
      <SubscribeContent />
    </Suspense>
  )
}
