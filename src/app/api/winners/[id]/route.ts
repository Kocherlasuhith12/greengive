import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const allowedFields = ['verification_status', 'payment_status', 'admin_notes']
  const updates: Record<string, string> = {}

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (updates.verification_status === 'approved') {
    updates['verified_at'] = new Date().toISOString()
  }
  if (updates.payment_status === 'paid') {
    updates['paid_at'] = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('winners')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ winner: data })
}
