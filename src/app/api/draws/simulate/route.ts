import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runSimulation } from '@/lib/drawEngine'

export async function POST(req: Request) {
  const supabase = createClient()
  const admin = createAdminClient()

  // Auth check — admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { draw_type = 'random', jackpot_rollover = 0 } = await req.json()

  // Fetch active subscriptions
  const { data: activeSubs } = await admin
    .from('subscriptions')
    .select('user_id, amount_pence')
    .eq('status', 'active')

  if (!activeSubs?.length) {
    return NextResponse.json({ error: 'No active subscribers to simulate a draw' }, { status: 400 })
  }

  const activeUserIds = activeSubs.map(s => s.user_id)

  // Fetch all current scores for active subscribers
  const { data: allScores } = await admin
    .from('scores')
    .select('user_id, score')
    .in('user_id', activeUserIds)

  // Build per-user entry arrays
  const userScoreMap: Record<string, number[]> = {}
  for (const s of allScores || []) {
    if (!userScoreMap[s.user_id]) userScoreMap[s.user_id] = []
    userScoreMap[s.user_id].push(s.score)
  }

  // Only include users with at least 1 score
  const userEntries = Object.entries(userScoreMap)
    .filter(([, scores]) => scores.length > 0)
    .map(([user_id, entry_numbers]) => ({ user_id, entry_numbers }))

  const allScoreValues = (allScores || []).map(s => s.score)

  const result = runSimulation(
    draw_type,
    allScoreValues,
    activeSubs,
    userEntries,
    jackpot_rollover
  )

  return NextResponse.json({
    ...result,
    active_subscribers: activeSubs.length,
    eligible_entries: userEntries.length,
  })
}
