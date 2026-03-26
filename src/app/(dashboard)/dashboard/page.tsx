import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Target, Trophy, Heart, ChevronRight, AlertCircle, Sparkles } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { welcome?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, subscriptionRes, scoresRes, nextDrawRes, winningsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('subscriptions')
      .select('*, charities(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single(),
    supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(5),
    supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('winners').select('*').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const subscription = subscriptionRes.data
  const scores = scoresRes.data || []
  const lastDraw = nextDrawRes.data?.[0]
  const winnings = winningsRes.data || []

  const totalWon = winnings.reduce((sum, w) => {
    return sum + (w.payment_status === 'paid' ? w.prize_amount_pence : 0)
  }, 0)

  const pendingWinnings = winnings.filter((w) => w.payment_status === 'pending').length
  const isActive = subscription?.status === 'active'

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {searchParams.welcome && (
        <div className="p-4 rounded-2xl bg-brand-900/30 border border-brand-700 flex items-center gap-3">
          <Sparkles size={20} className="text-brand-400 shrink-0" />
          <div>
            <p className="text-brand-300 font-medium text-sm">Welcome to GreenGive!</p>
            <p className="text-brand-500 text-xs mt-0.5">
              Start by entering your first golf score below.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s your GreenGive overview</p>
      </div>

      <div
        className={`p-5 rounded-2xl border ${
          isActive ? 'bg-brand-900/20 border-brand-700/50' : 'bg-red-900/10 border-red-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Subscription</p>
            <div className="flex items-center gap-2">
              <span className={isActive ? 'badge-active' : 'badge-danger'}>
                {subscription?.status || 'No subscription'}
              </span>
              {subscription && (
                <span className="text-sm text-gray-400 capitalize">{subscription.plan} plan</span>
              )}
            </div>

            {subscription?.current_period_end && (
              <p className="text-xs text-gray-600 mt-1.5">
                {isActive ? 'Renews' : 'Expired'}: {formatDate(subscription.current_period_end)}
              </p>
            )}
          </div>

          {!isActive && (
            <Link href="/subscribe" className="btn-primary text-sm px-4 py-2">
              Subscribe now
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Scores logged"
          value={scores.length.toString()}
          sub="of 5 max"
          color="text-brand-400"
          href="/scores"
        />

        <StatCard
          label="Draws entered"
          value={winnings.length > 0 ? winnings.length.toString() : '0'}
          sub="all time"
          color="text-blue-400"
          href="/draws"
        />

        <StatCard
          label="Total won"
          value={totalWon > 0 ? formatCurrency(totalWon) : '£0'}
          sub={pendingWinnings > 0 ? `${pendingWinnings} pending` : 'lifetime'}
          color="text-gold-400"
          href="/winnings"
        />

        <StatCard
          label="Charity %"
          value={subscription ? `${subscription.charity_percentage}%` : '—'}
          sub="of subscription"
          color="text-pink-400"
          href="/charity"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-brand-400" />
              <h2 className="text-base font-semibold text-white">Recent scores</h2>
            </div>

            <Link
              href="/scores"
              className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-0.5"
            >
              Manage <ChevronRight size={12} />
            </Link>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-6">
              <Target size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No scores yet</p>
              <Link href="/scores" className="btn-primary text-sm px-4 py-2 mt-3 inline-flex">
                Add your first score
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                    <span className="text-sm text-gray-300">{formatDate(s.played_at)}</span>
                  </div>
                  <span className="text-lg font-display font-bold text-brand-400">{s.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={18} className="text-pink-400" />
              <h2 className="text-base font-semibold text-white">Your charity</h2>
            </div>

            {(subscription as any)?.charities ? (
              <div>
                <p className="text-white font-medium">{(subscription as any).charities.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {subscription!.charity_percentage}% of your subscription ·{' '}
                  {formatCurrency(
                    Math.round(
                      (subscription!.amount_pence * subscription!.charity_percentage) / 100
                    )
                  )}{' '}
                  per {subscription!.plan === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-gold-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-400">
                  No charity selected.{' '}
                  <Link href="/charity" className="text-brand-400 hover:underline">
                    Choose one
                  </Link>
                </p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-gold-400" />
              <h2 className="text-base font-semibold text-white">Latest draw</h2>
            </div>

            {lastDraw ? (
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  {lastDraw.draw_month} · {lastDraw.active_subscribers} participants
                </p>

                <div className="flex gap-2 flex-wrap">
                  {lastDraw.drawn_numbers.map((n: number, i: number) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gold-900/30 border border-gold-700/50 flex items-center justify-center text-gold-400 font-display font-bold text-sm"
                    >
                      {n}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-600 mt-3">
                  Prize pool: {formatCurrency(lastDraw.total_pool_pence)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No draws published yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
  href,
}: {
  label: string
  value: string
  sub: string
  color: string
  href: string
}) {
  return (
    <Link href={href} className="card-hover p-4 block group">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </Link>
  )
}