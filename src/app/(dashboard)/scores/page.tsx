'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Info, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Score } from '@/types'

export default function ScoresPage() {
  const supabase = createClient()
  const [scores, setScores]       = useState<Score[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({ score: '', played_at: '' })

  const fetchScores = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
    setScores(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchScores() }, [fetchScores])

  async function addScore(e: React.FormEvent) {
    e.preventDefault()
    const scoreVal = parseInt(form.score)
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      setError('Score must be between 1 and 45 (Stableford format)')
      return
    }
    if (!form.played_at) {
      setError('Please select the date you played')
      return
    }

    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreVal,
      played_at: form.played_at,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Score added! Your draw entry has been updated.')
      setForm({ score: '', played_at: '' })
      await fetchScores()
      setTimeout(() => setSuccess(''), 4000)
    }
    setSubmitting(false)
  }

  async function deleteScore(id: string) {
    await supabase.from('scores').delete().eq('id', id)
    await fetchScores()
  }

  const scoreValues = scores.map(s => s.score)
  const avg = scoreValues.length ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1) : '—'
  const best = scoreValues.length ? Math.max(...scoreValues) : '—'

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">My Scores</h1>
        <p className="text-gray-400 text-sm mt-1">Your last 5 Stableford scores power your monthly draw entry</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/20 border border-blue-700/40">
        <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-300/80">
          Only your <strong className="text-blue-200">5 most recent scores</strong> are kept. When you add a new score,
          the oldest one is automatically removed. These scores become your draw numbers each month.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Scores logged', value: `${scores.length}/5` },
          { label: 'Average', value: avg },
          { label: 'Best score', value: best },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-brand-400">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add score form */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-400" />
            Add a score
          </h2>

          <form onSubmit={addScore} className="space-y-4">
            <div>
              <label className="label">
                Stableford score <span className="text-gray-600">(1 – 45)</span>
              </label>
              <input
                type="number" min={1} max={45} required
                className="input text-2xl font-display font-bold text-center"
                placeholder="e.g. 36"
                value={form.score}
                onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Date played</label>
              <input
                type="date" required
                className="input"
                max={new Date().toISOString().split('T')[0]}
                value={form.played_at}
                onChange={e => setForm(f => ({ ...f, played_at: e.target.value }))}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-400 text-sm">
                {error}
              </div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-brand-900/30 border border-brand-700 text-brand-300 text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={submitting || scores.length >= 5 && false}
              className="btn-primary w-full justify-center">
              {submitting ? 'Adding…' : scores.length >= 5 ? 'Add & replace oldest' : 'Add score'}
            </button>
          </form>
        </div>

        {/* Scores list */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            Your draw numbers
            <span className="ml-2 text-xs text-gray-600 font-normal">
              ({scores.length}/5 slots used)
            </span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-dark-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">⛳</div>
              <p className="text-gray-500 text-sm">No scores yet.</p>
              <p className="text-gray-600 text-xs mt-1">Add your first score to enter draws.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark-700 border border-dark-500 group"
                  >
                    {/* Number bubble */}
                    <div className="w-10 h-10 rounded-full bg-brand-900/40 border border-brand-700/50 flex items-center justify-center text-brand-400 font-display font-bold text-lg shrink-0">
                      {s.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">
                        Score: <span className="text-brand-400 font-bold">{s.score}</span>
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(s.played_at)}</p>
                    </div>
                    {i === 0 && (
                      <span className="text-xs text-brand-600 font-medium hidden group-hover:hidden">Latest</span>
                    )}
                    <button
                      onClick={() => deleteScore(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {scores.length > 0 && (
            <p className="text-xs text-gray-600 mt-4 text-center">
              Scores shown newest first · hover a row to delete
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
