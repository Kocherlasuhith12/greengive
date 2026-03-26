import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runSimulation } from '@/lib/drawEngine'

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  // Auth — admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { draw_month, draw_type = 'random' } = await req.json()

  if (!draw_month) return NextResponse.json({ error: 'draw_month is required (e.g. 2026-03)' }, { status: 400 })

  // Check draw doesn't already exist for this month
  const { data: existing } = await admin
    .from('draws')
    .select('id, status')
    .eq('draw_month', draw_month)
    .single()

  if (existing?.status === 'published') {
    return NextResponse.json({ error: `Draw for ${draw_month} is already published` }, { status: 409 })
  }

  // Fetch active subscriptions
  const { data: activeSubs } = await admin
    .from('subscriptions')
    .select('user_id, amount_pence')
    .eq('status', 'active')

  if (!activeSubs?.length) {
    return NextResponse.json({ error: 'No active subscribers' }, { status: 400 })
  }

  const activeUserIds = activeSubs.map(s => s.user_id)

  // Fetch scores
  const { data: allScores } = await admin
    .from('scores')
    .select('user_id, score')
    .in('user_id', activeUserIds)

  const userScoreMap: Record<string, number[]> = {}
  for (const s of allScores || []) {
    if (!userScoreMap[s.user_id]) userScoreMap[s.user_id] = []
    userScoreMap[s.user_id].push(s.score)
  }

  const userEntries = Object.entries(userScoreMap)
    .filter(([, scores]) => scores.length > 0)
    .map(([user_id, entry_numbers]) => ({ user_id, entry_numbers }))

  const allScoreValues = (allScores || []).map(s => s.score)

  // Get jackpot rollover from previous unpublished draw if any
  const { data: prevDraw } = await admin
    .from('draws')
    .select('pool_5_match, jackpot_rollover')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(1)
    .single()

  // Rollover applies if previous jackpot was unclaimed (no 5-match winners)
  let jackpot_rollover = 0
  if (prevDraw) {
    const { data: prevWinners } = await admin
      .from('winners')
      .select('id')
      .eq('match_type', '5_match')
      .limit(1)
    if (!prevWinners?.length) {
      jackpot_rollover = prevDraw.pool_5_match + (prevDraw.jackpot_rollover || 0)
    }
  }

  // Run the draw
  const result = runSimulation(draw_type, allScoreValues, activeSubs, userEntries, jackpot_rollover)

  // ── Write to DB ─────────────────────────────────────────────

  // 1. Upsert the draw record
  const { data: draw, error: drawError } = await admin
    .from('draws')
    .upsert({
      draw_month,
      status: 'published',
      draw_type,
      drawn_numbers: result.drawn_numbers,
      total_pool_pence: result.total_pool_pence,
      pool_5_match: result.pool_5_match,
      pool_4_match: result.pool_4_match,
      pool_3_match: result.pool_3_match,
      jackpot_rollover,
      active_subscribers: activeSubs.length,
      created_by: user.id,
      published_at: new Date().toISOString(),
    }, { onConflict: 'draw_month' })
    .select()
    .single()

  if (drawError || !draw) {
    return NextResponse.json({ error: 'Failed to save draw', detail: drawError?.message }, { status: 500 })
  }

  // 2. Insert draw entries
  const entryRows = result.entry_results.map(e => ({
    draw_id: draw.id,
    user_id: e.user_id,
    entry_numbers: e.entry_numbers,
    match_count: e.match_count,
    is_winner: e.is_winner,
  }))

  if (entryRows.length > 0) {
    await admin.from('draw_entries').upsert(entryRows, { onConflict: 'draw_id,user_id' })
  }

  // 3. Fetch draw_entry IDs for winners
  const winnerUserIds = result.prize_allocations.map(p => p.user_id)
  const { data: winnerEntries } = winnerUserIds.length > 0
    ? await admin.from('draw_entries').select('id, user_id').eq('draw_id', draw.id).in('user_id', winnerUserIds)
    : { data: [] }

  const entryMap: Record<string, string> = {}
  for (const e of winnerEntries || []) entryMap[e.user_id] = e.id

  // 4. Insert winner records
  const winnerRows = result.prize_allocations.map(p => ({
    draw_id: draw.id,
    user_id: p.user_id,
    draw_entry_id: entryMap[p.user_id] || null,
    match_type: p.match_type,
    prize_amount_pence: p.prize_amount_pence,
    verification_status: 'pending',
    payment_status: 'pending',
  }))

  if (winnerRows.length > 0) {
    await admin.from('winners').insert(winnerRows)
  }

  return NextResponse.json({
    success: true,
    draw_id: draw.id,
    draw_month,
    drawn_numbers: result.drawn_numbers,
    total_pool_pence: result.total_pool_pence,
    active_subscribers: activeSubs.length,
    eligible_entries: userEntries.length,
    winner_count: result.winner_count,
    jackpot_carried: result.jackpot_carried,
    jackpot_rollover,
    summary: result.summary,
  })
}
