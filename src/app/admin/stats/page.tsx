import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Users, Trophy, Heart, BarChart3 } from 'lucide-react'

export default async function AdminStatsPage() {
  const supabase = createClient()

  const [usersRes, subsRes, drawsRes, charitiesRes, winnersRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('subscriptions').select('plan, status, amount_pence, charity_percentage'),
    supabase.from('draws').select('total_pool_pence, status, draw_month').eq('status', 'published'),
    supabase.from('charities').select('name, total_raised').eq('is_active', true),
    supabase.from('winners').select('prize_amount_pence, payment_status, match_type'),
  ])

  const totalUsers    = usersRes.count || 0
  const subs          = subsRes.data || []
  const activeSubs    = subs.filter(s => s.status === 'active')
  const totalRevenue  = subs.reduce((sum, s) => sum + s.amount_pence, 0)
  const totalDrawPool = (drawsRes.data || []).reduce((sum, d) => sum + (d.total_pool_pence || 0), 0)
  const totalWinners  = (winnersRes.data || []).length
  const totalPaidOut  = (winnersRes.data || [])
    .filter(w => w.payment_status === 'paid')
    .reduce((sum, w) => sum + w.prize_amount_pence, 0)

  const monthlyCount = activeSubs.filter(s => s.plan === 'monthly').length
  const yearlyCount  = activeSubs.filter(s => s.plan === 'yearly').length

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide statistics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total users',       value: totalUsers,                   icon: Users,    color: 'text-brand-400' },
          { label: 'Active subscribers', value: activeSubs.length,           icon: BarChart3, color: 'text-blue-400' },
          { label: 'Total revenue',     value: formatCurrency(totalRevenue), icon: Trophy,   color: 'text-gold-400' },
          { label: 'Total paid out',    value: formatCurrency(totalPaidOut), icon: Heart,    color: 'text-pink-400' },
        ].map(metric => (
          <div key={metric.label} className="card p-5">
            <metric.icon size={20} className={`${metric.color} mb-3`} />
            <p className={`text-2xl font-display font-bold ${metric.color}`}>{metric.value}</p>
            <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Subscription breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Subscription breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-dark-600">
              <span className="text-sm text-gray-400">Monthly subscribers</span>
              <span className="font-semibold text-white">{monthlyCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-600">
              <span className="text-sm text-gray-400">Yearly subscribers</span>
              <span className="font-semibold text-white">{yearlyCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-600">
              <span className="text-sm text-gray-400">Total active</span>
              <span className="font-semibold text-brand-400">{activeSubs.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Total draws published</span>
              <span className="font-semibold text-white">{drawsRes.data?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Charity totals */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Charity contributions</h2>
          {(charitiesRes.data || []).length === 0 ? (
            <p className="text-sm text-gray-500">No data yet</p>
          ) : (
            <div className="space-y-2">
              {(charitiesRes.data || []).map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                  <span className="text-sm text-gray-300">{c.name}</span>
                  <span className="text-sm font-semibold text-pink-400">{formatCurrency(c.total_raised)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Winners summary */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Prize pool summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total pool distributed</p>
            <p className="text-xl font-display font-bold text-gold-400">{formatCurrency(totalDrawPool)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total winners</p>
            <p className="text-xl font-display font-bold text-white">{totalWinners}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Amount paid out</p>
            <p className="text-xl font-display font-bold text-brand-400">{formatCurrency(totalPaidOut)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
