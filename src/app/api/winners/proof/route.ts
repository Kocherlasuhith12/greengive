import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/winners/proof — user submits proof for a winning entry
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { winner_id, proof_url } = body

  if (!winner_id) return NextResponse.json({ error: 'winner_id required' }, { status: 400 })
  if (!proof_url)  return NextResponse.json({ error: 'proof_url required' }, { status: 400 })

  // Verify this winner record belongs to the requesting user
  const { data: winner } = await supabase
    .from('winners')
    .select('id, user_id, verification_status')
    .eq('id', winner_id)
    .eq('user_id', user.id)
    .single()

  if (!winner) return NextResponse.json({ error: 'Winner record not found' }, { status: 404 })
  if (winner.verification_status !== 'pending') {
    return NextResponse.json({ error: 'Proof already submitted or already reviewed' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('winners')
    .update({ proof_url, submitted_at: new Date().toISOString() })
    .eq('id', winner_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ winner: data })
}
