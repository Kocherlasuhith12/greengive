import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/subscriptions — update own subscription (cancel, change charity %)
export async function PATCH(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const allowed = ['status', 'charity_id', 'charity_percentage']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k]
  }

  // Validate charity_percentage
  if (updates.charity_percentage !== undefined) {
    const pct = Number(updates.charity_percentage)
    if (isNaN(pct) || pct < 10 || pct > 100) {
      return NextResponse.json({ error: 'Charity percentage must be 10–100' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscription: data })
}
