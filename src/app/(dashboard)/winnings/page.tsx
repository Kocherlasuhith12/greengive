'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Upload, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Winner {
  id: string
  match_type: string
  prize_amount_pence: number
  verification_status: string
  payment_status: string
  proof_url: string | null
  submitted_at: string | null
  paid_at: string | null
  created_at: string
  draws: { draw_month: string } | null
}

export default function WinningsPage() {
  const [winners, setWinners]     = useState<Winner[]>([])
  const [loading, setLoading]     = useState(true)
  const [proofInputs, setProofInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const fetchWinnings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/winners/my')
    const data = await res.json()
    if (data.winners) setWinners(data.winners)
    setLoading(false)
  }, [])

  useEffect(() => { fetchWinnings() }, [fetchWinnings])

  async function submitProof(winnerId: string) {
    const url = proofInputs[winnerId]?.trim()
    if (!url) return
    setSubmitting(winnerId)
    const res = await fetch('/api/winners/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_id: winnerId, proof_url: url }),
    })
    if (res.ok) {
      setSubmitted(winnerId)
      setTimeout(() => setSubmitted(null), 4000)
      fetchWinnings()
    }
    setSubmitting(null)
  }

  const totalWon   = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount_pence, 0)
  const pending    = winners.filter(w => w.payment_status === 'pending').length
  const matchColor = (type: string) =>
    type === '5_match' ? 'text-gold-400' : type === '4_match' ? 'text-brand-400' : 'text-blue-400'

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">My Winnings</h1>
        <p className="text-gray-400 text-sm mt-1">Track your prizes and submit verification proof</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-display font-bold text-gold-400">{formatCurrency(totalWon)}</p>
          <p className="text-xs text-gray-500 mt-1">Total paid out</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-display font-bold text-white">{winners.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total wins</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-display font-bold text-brand-400">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending payment</p>
        </div>
      </div>

      {/* Winners list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-dark-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : winners.length === 0 ? (
        <div className="card p-16 text-center">
          <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-white font-medium">No wins yet</p>
          <p className="text-gray-500 text-sm mt-1">Enter scores and participate in draws to win</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(w => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-900/30 flex items-center justify-center">
                    <Trophy size={18} className="text-gold-400" />
                  </div>
                  <div>
                    <p className={`font-semibold text-base ${matchColor(w.match_type)}`}>
                      {w.match_type.replace('_', ' ')} — {formatCurrency(w.prize_amount_pence)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Draw: {w.draws?.draw_month} · Won: {formatDate(w.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={w.verification_status} type="verification" />
                  <StatusBadge status={w.payment_status} type="payment" />
                </div>
              </div>

              {/* Proof submission */}
              {w.verification_status === 'pending' && !w.proof_url && (
                <div className="pt-4 border-t border-dark-600">
                  <p className="text-xs text-gray-400 mb-2">
                    Submit proof of your scores (screenshot URL from the golf platform)
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-sm py-2"
                      placeholder="https://... (screenshot URL)"
                      value={proofInputs[w.id] || ''}
                      onChange={e => setProofInputs(p => ({ ...p, [w.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => submitProof(w.id)}
                      disabled={submitting === w.id || !proofInputs[w.id]?.trim()}
                      className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 shrink-0"
                    >
                      <Upload size={14} />
                      {submitting === w.id ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {submitted === w.id && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-brand-400 flex items-center gap-1 mt-2">
                        <CheckCircle size={12} /> Proof submitted — awaiting admin review
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {w.proof_url && (
                <div className="pt-4 border-t border-dark-600 flex items-center gap-2">
                  <CheckCircle size={14} className="text-brand-500" />
                  <p className="text-xs text-gray-500">
                    Proof submitted {w.submitted_at ? formatDate(w.submitted_at) : ''} · Under review
                  </p>
                </div>
              )}

              {w.payment_status === 'paid' && w.paid_at && (
                <div className="pt-4 border-t border-dark-600 flex items-center gap-2">
                  <CheckCircle size={14} className="text-brand-400" />
                  <p className="text-xs text-brand-500">Paid on {formatDate(w.paid_at)}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, type }: { status: string; type: 'verification' | 'payment' }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:  { label: 'Pending',  cls: 'badge-inactive', icon: <Clock size={10} /> },
    approved: { label: 'Approved', cls: 'badge-active',   icon: <CheckCircle size={10} /> },
    rejected: { label: 'Rejected', cls: 'badge-danger',   icon: <XCircle size={10} /> },
    paid:     { label: 'Paid',     cls: 'badge-active',   icon: <CheckCircle size={10} /> },
  }
  const s = map[status] || map.pending
  return (
    <span className={`badge ${s.cls} flex items-center gap-1 text-xs`}>
      {s.icon} {type === 'verification' ? 'Verify: ' : 'Pay: '}{s.label}
    </span>
  )
}
