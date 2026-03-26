import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/donations — make an independent donation
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { charity_id, amount_pence } = body

  if (!charity_id) return NextResponse.json({ error: 'charity_id is required' }, { status: 400 })
  if (!amount_pence || amount_pence < 100) {
    return NextResponse.json({ error: 'Minimum donation is £1.00' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('charity_donations')
    .insert({ user_id: user.id, charity_id, amount_pence, is_subscription_contribution: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update charity total_raised
  await supabase.rpc('increment_charity_raised', {
    charity_id_input: charity_id,
    amount_input: amount_pence,
  }).then(() => {})

  return NextResponse.json({ donation: data }, { status: 201 })
}

// GET /api/donations — user's donation history
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data, error } = await supabase
    .from('charity_donations')
    .select('*, charities(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ donations: data })
}
