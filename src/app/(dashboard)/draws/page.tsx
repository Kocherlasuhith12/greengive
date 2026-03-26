import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trophy, AlertCircle } from 'lucide-react'

export default async function DrawsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [drawsRes, entriesRes, scoresRes, subRes] = await Promise.all([
    supabase.from('draws').select('*').eq('status', 'published').order('draw_month', { ascending: false }),
    supabase.from('draw_entries').select('*').eq('user_id', user.id),
    supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
    supabase.from('subscriptions').select('status').eq('user_id', user.id).single(),
  ])

  const draws       = drawsRes.data || []
  const entries     = entriesRes.data || []
  const userScores  = scoresRes.data || []
  const isActive    = subRes.data?.status === 'active'

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Monthly Draws</h1>
        <p className="text-gray-400 text-sm mt-1">Your scores vs the drawn numbers each month</p>
      </div>

      {/* Current entry */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Your current draw numbers</h2>
        {!isActive ? (
          <div className="flex items-center gap-2 text-sm text-gold-400">
            <AlertCircle size={16} />
            Subscribe to enter monthly draws
          </div>
        ) : userScores.length === 0 ? (
          <p className="text-sm text-gray-500">Add scores to get draw numbers</p>
        ) : (
          <>
            <div className="flex gap-3 flex-wrap">
              {userScores.map((s, i) => (
                <div key={s.id} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-900/40 border-2 border-brand-600/50 flex items-center justify-center text-brand-300 font-display font-bold text-lg">
                    {s.score}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{i + 1}</p>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: 5 - userScores.length }).map((_, i) => (
                <div key={`empty-${i}`} className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-dark-500 flex items-center justify-center text-gray-700 text-xl">
                    ?
                  </div>
                  <p className="text-xs text-gray-700 mt-1">—</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              {userScores.length}/5 draw numbers · add more scores to fill all slots
            </p>
          </>
        )}
      </div>

      {/* Published draws */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Draw history</h2>
        {draws.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No draws published yet</p>
            <p className="text-gray-600 text-xs mt-1">Check back after the first monthly draw</p>
          </div>
        ) : (
          <div className="space-y-4">
            {draws.map(draw => {
              const myEntry = entries.find(e => e.draw_id === draw.id)
              const matchCount = myEntry?.match_count || 0

              return (
                <div key={draw.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{draw.draw_month}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {draw.active_subscribers} participants · {formatCurrency(draw.total_pool_pence)} pool
                      </p>
                    </div>
                    {myEntry?.is_winner && (
                      <span className="badge-gold flex items-center gap-1">
                        <Trophy size={12} /> Winner!
                      </span>
                    )}
                    {myEntry && !myEntry.is_winner && (
                      <span className="text-xs text-gray-600">
                        {matchCount} match{matchCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                    {!myEntry && (
                      <span className="text-xs text-gray-700">Not entered</span>
                    )}
                  </div>

                  {/* Drawn numbers */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Drawn numbers</p>
                    <div className="flex gap-2 flex-wrap">
                      {draw.drawn_numbers.map((n: number, i: number) => {
                        const isMatch = myEntry?.entry_numbers?.includes(n)
                        return (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm border transition-colors ${
                              isMatch
                                ? 'bg-gold-900/40 border-gold-500 text-gold-300'
                                : 'bg-dark-700 border-dark-500 text-gray-400'
                            }`}
                          >
                            {n}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pool breakdown */}
                  <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-dark-600">
                    {[
                      { label: '5 match (40%)', value: draw.pool_5_match, jackpot: true },
                      { label: '4 match (35%)', value: draw.pool_4_match, jackpot: false },
                      { label: '3 match (25%)', value: draw.pool_3_match, jackpot: false },
                    ].map(tier => (
                      <div key={tier.label} className="text-center">
                        <p className="text-xs text-gray-600">{tier.label}</p>
                        <p className={`text-sm font-semibold mt-0.5 ${tier.jackpot ? 'text-gold-400' : 'text-brand-400'}`}>
                          {formatCurrency(tier.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
