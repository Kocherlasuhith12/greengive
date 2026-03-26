'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, CheckCircle, XCircle, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Winner {
  id: string
  match_type: string
  prize_amount_pence: number
  verification_status: string
  payment_status: string
  proof_url: string | null
  admin_notes: string | null
  submitted_at: string | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
  profiles: { full_name: string | null; email: string } | null
  draws: { draw_month: string } | null
}

export default function AdminWinnersPage() {
  const [winners, setWinners]     = useState<Winner[]>([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [notes, setNotes]         = useState<Record<string, string>>({})
  const [updating, setUpdating]   = useState<string | null>(null)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'approved' | 'paid'>('all')

  const fetchWinners = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/winners/list')
    const data = await res.json()
    if (data.winners) {
      setWinners(data.winners)
      // Prefill notes
      const noteMap: Record<string, string> = {}
      data.winners.forEach((w: Winner) => { noteMap[w.id] = w.admin_notes || '' })
      setNotes(noteMap)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchWinners() }, [fetchWinners])

  async function updateWinner(id: string, patch: Record<string, string>) {
    setUpdating(id)
    const res = await fetch(`/api/winners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patch, admin_notes: notes[id] || undefined }),
    })
    if (res.ok) await fetchWinners()
    setUpdating(null)
  }

  const filtered = winners.filter(w => {
    if (filter === 'all')      return true
    if (filter === 'pending')  return w.verification_status === 'pending'
    if (filter === 'approved') return w.verification_status === 'approved'
    if (filter === 'paid')     return w.payment_status === 'paid'
    return true
  })

  const matchColor = (type: string) =>
    type === '5_match' ? 'text-gold-400' : type === '4_match' ? 'text-brand-400' : 'text-blue-400'

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Winners</h1>
          <p className="text-gray-400 text-sm mt-1">Verify submissions and manage payouts</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-brand-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total winners', value: winners.length, color: 'text-white' },
          { label: 'Pending review', value: winners.filter(w => w.verification_status === 'pending').length, color: 'text-gold-400' },
          { label: 'Approved', value: winners.filter(w => w.verification_status === 'approved').length, color: 'text-brand-400' },
          { label: 'Paid out', value: formatCurrency(winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount_pence, 0)), color: 'text-pink-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Winners list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No winners {filter !== 'all' ? `with status: ${filter}` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(winner => (
            <div key={winner.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
                onClick={() => setExpanded(expanded === winner.id ? null : winner.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Trophy size={18} className={matchColor(winner.match_type)} />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {winner.profiles?.full_name || winner.profiles?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {winner.draws?.draw_month} · {winner.match_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-base font-display font-bold ${matchColor(winner.match_type)}`}>
                    {formatCurrency(winner.prize_amount_pence)}
                  </span>
                  <span className={`badge ${
                    winner.verification_status === 'approved' ? 'badge-active' :
                    winner.verification_status === 'rejected' ? 'badge-danger' : 'badge-inactive'
                  }`}>
                    {winner.verification_status}
                  </span>
                  <span className={`badge ${winner.payment_status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                    {winner.payment_status}
                  </span>
                  {expanded === winner.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded === winner.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-dark-600 space-y-4">
                      {/* Details */}
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Winner email</p>
                          <p className="text-white">{winner.profiles?.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Draw month</p>
                          <p className="text-white">{winner.draws?.draw_month || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Match type</p>
                          <p className={`font-semibold ${matchColor(winner.match_type)}`}>
                            {winner.match_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Prize amount</p>
                          <p className={`text-lg font-display font-bold ${matchColor(winner.match_type)}`}>
                            {formatCurrency(winner.prize_amount_pence)}
                          </p>
                        </div>
                        {winner.submitted_at && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Proof submitted</p>
                            <p className="text-white">{formatDate(winner.submitted_at)}</p>
                          </div>
                        )}
                        {winner.proof_url && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Proof document</p>
                            <a href={winner.proof_url} target="_blank" rel="noopener noreferrer"
                              className="text-brand-400 hover:underline text-xs">View proof</a>
                          </div>
                        )}
                      </div>

                      {/* Admin notes */}
                      <div>
                        <label className="label">Admin notes</label>
                        <textarea
                          rows={2}
                          className="input resize-none text-sm"
                          placeholder="Optional notes…"
                          value={notes[winner.id] || ''}
                          onChange={e => setNotes(n => ({ ...n, [winner.id]: e.target.value }))}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {winner.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateWinner(winner.id, { verification_status: 'approved' })}
                              disabled={updating === winner.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={15} /> Approve
                            </button>
                            <button
                              onClick={() => updateWinner(winner.id, { verification_status: 'rejected' })}
                              disabled={updating === winner.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/40 text-red-400 text-sm font-medium transition-colors border border-red-700/50 disabled:opacity-50"
                            >
                              <XCircle size={15} /> Reject
                            </button>
                          </>
                        )}

                        {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                          <button
                            onClick={() => updateWinner(winner.id, { payment_status: 'paid' })}
                            disabled={updating === winner.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-700/30 hover:bg-gold-700/50 text-gold-400 text-sm font-medium transition-colors border border-gold-700/40 disabled:opacity-50"
                          >
                            <CreditCard size={15} /> Mark as paid
                          </button>
                        )}

                        {winner.payment_status === 'paid' && (
                          <span className="flex items-center gap-1.5 px-4 py-2 text-brand-500 text-sm">
                            <CheckCircle size={15} /> Paid {winner.paid_at ? formatDate(winner.paid_at) : ''}
                          </span>
                        )}

                        {updating === winner.id && (
                          <span className="text-xs text-gray-500 self-center">Updating…</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
