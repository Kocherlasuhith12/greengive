// ============================================================
// Draw Engine — Core Logic
// Used by both simulation and publish flows
// ============================================================

import type { Draw } from '@/types'

export interface DrawResult {
  drawn_numbers: number[]
  total_pool_pence: number
  pool_5_match: number
  pool_4_match: number
  pool_3_match: number
  jackpot_rollover: number
  active_subscribers: number
}

export interface EntryResult {
  user_id: string
  entry_numbers: number[]
  match_count: number
  is_winner: boolean
  match_type: '3_match' | '4_match' | '5_match' | null
}

export interface PrizeAllocation {
  user_id: string
  match_type: '3_match' | '4_match' | '5_match'
  prize_amount_pence: number
}

// ── 1. Generate draw numbers ────────────────────────────────

/**
 * Random mode: pick 5 unique numbers from range 1–45
 */
export function generateRandomNumbers(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  const result: number[] = []
  while (result.length < 5) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

/**
 * Algorithmic mode: weight numbers by frequency across all user scores.
 * Draws numbers that appear MOST often — gives frequent scorers better odds.
 * If insufficient score data, falls back to random.
 */
export function generateAlgorithmicNumbers(
  allUserScores: number[]
): number[] {
  if (allUserScores.length < 10) return generateRandomNumbers()

  // Count frequency of each score value
  const freq: Record<number, number> = {}
  for (const s of allUserScores) {
    freq[s] = (freq[s] || 0) + 1
  }

  // Build weighted pool: each value appears proportional to its frequency
  const weighted: number[] = []
  for (const [val, count] of Object.entries(freq)) {
    for (let i = 0; i < count * 3; i++) weighted.push(Number(val))
  }

  // Pick 5 unique numbers from weighted pool
  const result: number[] = []
  const usedVals = new Set<number>()
  let attempts = 0

  while (result.length < 5 && attempts < 500) {
    const idx = Math.floor(Math.random() * weighted.length)
    const val = weighted[idx]
    if (!usedVals.has(val)) {
      result.push(val)
      usedVals.add(val)
    }
    attempts++
  }

  // Fill remaining slots randomly if needed
  while (result.length < 5) {
    const r = Math.floor(Math.random() * 45) + 1
    if (!usedVals.has(r)) { result.push(r); usedVals.add(r) }
  }

  return result.sort((a, b) => a - b)
}

// ── 2. Calculate prize pools ────────────────────────────────

const SUBSCRIPTION_POOL_RATE = 0.40 // 40% of each sub goes to prize pool
const SPLIT = { '5_match': 0.40, '4_match': 0.35, '3_match': 0.25 } as const

export function calculatePrizePool(
  activeSubscriptions: { amount_pence: number }[],
  jackpotRollover = 0
): { total: number; pool5: number; pool4: number; pool3: number } {
  const total = Math.round(
    activeSubscriptions.reduce((sum, s) => sum + s.amount_pence, 0) * SUBSCRIPTION_POOL_RATE
  ) + jackpotRollover

  return {
    total,
    pool5: Math.round(total * SPLIT['5_match']),
    pool4: Math.round(total * SPLIT['4_match']),
    pool3: Math.round(total * SPLIT['3_match']),
  }
}

// ── 3. Match user entries against drawn numbers ─────────────

export function matchEntry(
  entryNumbers: number[],
  drawnNumbers: number[]
): { match_count: number; is_winner: boolean; match_type: '3_match' | '4_match' | '5_match' | null } {
  const drawnSet = new Set(drawnNumbers)
  const match_count = entryNumbers.filter(n => drawnSet.has(n)).length

  if (match_count >= 5) return { match_count: 5, is_winner: true, match_type: '5_match' }
  if (match_count === 4) return { match_count: 4, is_winner: true, match_type: '4_match' }
  if (match_count === 3) return { match_count: 3, is_winner: true, match_type: '3_match' }
  return { match_count, is_winner: false, match_type: null }
}

// ── 4. Allocate prizes among winners ───────────────────────

export function allocatePrizes(
  entryResults: EntryResult[],
  pools: { pool5: number; pool4: number; pool3: number }
): PrizeAllocation[] {
  const allocations: PrizeAllocation[] = []

  const winners5 = entryResults.filter(e => e.match_type === '5_match')
  const winners4 = entryResults.filter(e => e.match_type === '4_match')
  const winners3 = entryResults.filter(e => e.match_type === '3_match')

  // 5-match: split pool equally (jackpot carried if no winner)
  if (winners5.length > 0) {
    const share = Math.floor(pools.pool5 / winners5.length)
    winners5.forEach(w => allocations.push({ user_id: w.user_id, match_type: '5_match', prize_amount_pence: share }))
  }

  // 4-match: split pool equally
  if (winners4.length > 0) {
    const share = Math.floor(pools.pool4 / winners4.length)
    winners4.forEach(w => allocations.push({ user_id: w.user_id, match_type: '4_match', prize_amount_pence: share }))
  }

  // 3-match: split pool equally
  if (winners3.length > 0) {
    const share = Math.floor(pools.pool3 / winners3.length)
    winners3.forEach(w => allocations.push({ user_id: w.user_id, match_type: '3_match', prize_amount_pence: share }))
  }

  return allocations
}

// ── 5. Full simulation (no DB writes) ──────────────────────

export interface SimulationResult {
  drawn_numbers: number[]
  total_pool_pence: number
  pool_5_match: number
  pool_4_match: number
  pool_3_match: number
  jackpot_carried: boolean
  entry_results: EntryResult[]
  prize_allocations: PrizeAllocation[]
  winner_count: number
  summary: {
    match5: number; match4: number; match3: number; no_match: number
  }
}

export function runSimulation(
  drawType: 'random' | 'algorithmic',
  allUserScores: number[],
  activeSubscriptions: { amount_pence: number }[],
  userEntries: { user_id: string; entry_numbers: number[] }[],
  jackpotRollover = 0
): SimulationResult {
  const drawn_numbers = drawType === 'algorithmic'
    ? generateAlgorithmicNumbers(allUserScores)
    : generateRandomNumbers()

  const pools = calculatePrizePool(activeSubscriptions, jackpotRollover)

  const entry_results: EntryResult[] = userEntries.map(entry => ({
    user_id: entry.user_id,
    entry_numbers: entry.entry_numbers,
    ...matchEntry(entry.entry_numbers, drawn_numbers),
  }))

  const prize_allocations = allocatePrizes(entry_results, {
    pool5: pools.pool5, pool4: pools.pool4, pool3: pools.pool3
  })

  const jackpot_carried = entry_results.filter(e => e.match_type === '5_match').length === 0

  const summary = {
    match5: entry_results.filter(e => e.match_type === '5_match').length,
    match4: entry_results.filter(e => e.match_type === '4_match').length,
    match3: entry_results.filter(e => e.match_type === '3_match').length,
    no_match: entry_results.filter(e => !e.is_winner).length,
  }

  return {
    drawn_numbers,
    total_pool_pence: pools.total,
    pool_5_match: pools.pool5,
    pool_4_match: pools.pool4,
    pool_3_match: pools.pool3,
    jackpot_carried,
    entry_results,
    prize_allocations,
    winner_count: prize_allocations.length,
    summary,
  }
}
