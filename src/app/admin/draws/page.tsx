'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Zap, Trophy, AlertTriangle, CheckCircle,
  RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SimResult {
  drawn_numbers: number[]
  total_pool_pence: number
  pool_5_match: number
  pool_4_match: number
  pool_3_match: number
  jackpot_carried: boolean
  winner_count: number
  active_subscribers: number
  eligible_entries: number
  summary: { match5: number; match4: number; match3: number; no_match: number }
}

interface DrawRecord {
  id: string
  draw_month: string
  status: string
  draw_type: string
  drawn_numbers: number[]
  total_pool_pence: number
  active_subscribers: number
  published_at: string | null
}

export default function AdminDrawsPage() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [drawMonth, setDrawMonth]   = useState(defaultMonth)
  const [drawType, setDrawType]     = useState<'random' | 'algorithmic'>('random')
  const [simResult, setSimResult]   = useState<SimResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState<{ success: boolean; text: string } | null>(null)
  const [draws, setDraws]           = useState<DrawRecord[]>([])
  const [loadingDraws, setLoadingDraws] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError]           = useState('')

  const fetchDraws = useCallback(async () => {
    setLoadingDraws(true)
    const res = await fetch('/api/draws/list')
    const data = await res.json()
    if (data.draws) setDraws(data.draws)
    setLoadingDraws(false)
  }, [])

  useEffect(() => { fetchDraws() }, [fetchDraws])

  async function simulate() {
    setSimulating(true)
    setError('')
    setSimResult(null)
    setPublishMsg(null)
    const res = await fetch('/api/draws/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_type: drawType }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Simulation failed'); setSimulating(false); return }
    setSimResult(data)
    setSimulating(false)
  }

  async function publish() {
    if (!confirm(`Publish draw for ${drawMonth}? This cannot be undone.`)) return
    setPublishing(true)
    setError('')
    const res = await fetch('/api/draws/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_month: drawMonth, draw_type: drawType }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Publish failed')
    } else {
      setPublishMsg({
        success: true,
        text: `Draw published! ${data.winner_count} winner(s). ${data.jackpot_carried ? 'Jackpot rolls over.' : ''}`,
      })
      setSimResult(null)
      fetchDraws()
    }
    setPublishing(false)
  }

  const alreadyPublished = draws.some(d => d.draw_month === drawMonth && d.status === 'published')

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Draw Engine</h1>
        <p className="text-gray-400 text-sm mt-1">Configure, simulate, and publish monthly prize draws</p>
      </div>

      {/* Config */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Zap size={18} className="text-gold-400" /> Configuration
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">Draw month</label>
            <input type="month" className="input" value={drawMonth}
              onChange={e => { setDrawMonth(e.target.value); setSimResult(null); setPublishMsg(null) }} />
            {alreadyPublished && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} /> Already published for this month
              </p>
            )}
          </div>

          <div>
            <label className="label">Draw logic</label>
            <div className="grid grid-cols-2 gap-3">
              {(['random', 'algorithmic'] as const).map(t => (
                <button key={t} type="button" onClick={() => setDrawType(t)}
                  className={`p-3 rounded-xl border text-left transition-all ${drawType === t ? 'border-brand-500 bg-brand-900/20' : 'border-dark-500 hover:border-dark-400'}`}>
                  <p className="text-sm font-semibold text-white capitalize">{t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t === 'random' ? 'Standard lottery' : 'Score-frequency weighted'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-dark-700 flex items-start gap-2">
          <Info size={14} className="text-gray-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            Prize pool = 40% of all active subscriptions.
            Split: <span className="text-gold-400">40% jackpot</span> · <span className="text-brand-400">35% 4-match</span> · <span className="text-blue-400">25% 3-match</span>.
            Unclaimed jackpots roll to next month.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={simulate} disabled={simulating || alreadyPublished} className="btn-secondary flex items-center gap-2">
            {simulating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            {simulating ? 'Simulating…' : 'Run simulation'}
          </button>
          <button onClick={publish} disabled={publishing || alreadyPublished} className="btn-primary flex items-center gap-2">
            {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            {publishing ? 'Publishing…' : `Publish ${drawMonth}`}
          </button>
        </div>
      </div>

      {/* Publish success */}
      <AnimatePresence>
        {publishMsg?.success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-brand-900/30 border border-brand-700 flex items-start gap-3">
            <CheckCircle size={20} className="text-brand-400 shrink-0 mt-0.5" />
            <p className="text-brand-300 text-sm">{publishMsg.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation result */}
      <AnimatePresence>
        {simResult && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="card p-6 border border-dashed border-gold-700/30">
            <div className="flex items-center gap-2 mb-5">
              <Trophy size={18} className="text-gold-400" />
              <h2 className="text-base font-semibold text-white">Simulation preview</h2>
              <span className="badge bg-dark-600 text-gray-400 text-xs">not saved</span>
            </div>

            {/* Numbers */}
            <p className="text-xs text-gray-500 mb-3">Drawn numbers</p>
            <div className="flex gap-3 mb-6">
              {simResult.drawn_numbers.map((n, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                  className="w-14 h-14 rounded-full bg-gold-900/30 border-2 border-gold-600/50 flex items-center justify-center text-gold-300 font-display font-bold text-xl">
                  {n}
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Subscribers', value: simResult.active_subscribers, color: 'text-white' },
                { label: 'Eligible entries', value: simResult.eligible_entries, color: 'text-brand-400' },
                { label: 'Prize pool', value: formatCurrency(simResult.total_pool_pence), color: 'text-gold-400' },
                { label: 'Winners', value: simResult.winner_count, color: simResult.winner_count > 0 ? 'text-brand-400' : 'text-gray-500' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-dark-700">
                  <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Prize tiers */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: '5-match jackpot (40%)', val: simResult.pool_5_match, color: 'text-gold-400', border: 'border-gold-700/30', note: simResult.jackpot_carried ? '↪ Rolls over' : '' },
                { label: '4-match pool (35%)',    val: simResult.pool_4_match, color: 'text-brand-400', border: 'border-brand-700/30', note: '' },
                { label: '3-match pool (25%)',    val: simResult.pool_3_match, color: 'text-blue-400',  border: 'border-blue-700/30',  note: '' },
              ].map(t => (
                <div key={t.label} className={`p-4 rounded-xl bg-dark-700 border ${t.border} text-center`}>
                  <p className={`text-lg font-display font-bold ${t.color}`}>{formatCurrency(t.val)}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.label}</p>
                  {t.note && <p className="text-xs text-gold-600 mt-1">{t.note}</p>}
                </div>
              ))}
            </div>

            {/* Match breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: '5-match', count: simResult.summary.match5, color: 'text-gold-400' },
                { label: '4-match', count: simResult.summary.match4, color: 'text-brand-400' },
                { label: '3-match', count: simResult.summary.match3, color: 'text-blue-400' },
                { label: 'No match', count: simResult.summary.no_match, color: 'text-gray-500' },
              ].map(m => (
                <div key={m.label} className="text-center p-3 rounded-xl bg-dark-700/50">
                  <p className={`text-xl font-bold font-display ${m.color}`}>{m.count}</p>
                  <p className="text-xs text-gray-600">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-dark-600">
              <button onClick={simulate} className="btn-ghost text-sm flex items-center gap-1.5">
                <RefreshCw size={14} /> Re-run
              </button>
              <button onClick={publish} disabled={publishing || alreadyPublished} className="btn-primary text-sm">
                {publishing ? 'Publishing…' : `Publish for ${drawMonth}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Draw history</h2>
        {loadingDraws ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-dark-700 rounded-2xl animate-pulse" />)}
          </div>
        ) : draws.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No draws yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {draws.map(draw => (
              <div key={draw.id} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === draw.id ? null : draw.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`badge ${draw.status === 'published' ? 'badge-active' : 'badge-inactive'}`}>{draw.status}</span>
                    <span className="font-semibold text-white">{draw.draw_month}</span>
                    <span className="text-xs text-gray-500 capitalize hidden sm:inline">{draw.draw_type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gold-400 font-semibold">{formatCurrency(draw.total_pool_pence)}</span>
                    <span className="text-xs text-gray-600">{draw.active_subscribers} subs</span>
                    {expandedId === draw.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedId === draw.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-dark-600 pt-4">
                        <p className="text-xs text-gray-500 mb-3">Drawn numbers</p>
                        <div className="flex gap-2 flex-wrap">
                          {draw.drawn_numbers.map((n: number, i: number) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-gold-900/30 border border-gold-700/50 flex items-center justify-center text-gold-400 font-display font-bold text-sm">
                              {n}
                            </div>
                          ))}
                        </div>
                        {draw.published_at && (
                          <p className="text-xs text-gray-600 mt-3">
                            Published: {new Date(draw.published_at).toLocaleString('en-GB')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
