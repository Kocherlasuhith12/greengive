import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('winners')
      .select(`
        id,
        draw_id,
        user_id,
        draw_entry_id,
        match_type,
        prize_amount_pence,
        verification_status,
        proof_url,
        payment_status,
        admin_notes,
        submitted_at,
        verified_at,
        paid_at,
        created_at,
        draws (
          draw_month
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Winners API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ winners: data ?? [] }, { status: 200 })
  } catch (err) {
    console.error('Unexpected winners API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}