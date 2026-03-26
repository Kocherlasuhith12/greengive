import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Update profile fields
  if (body.full_name !== undefined || body.role !== undefined) {
    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.full_name !== undefined) profileUpdates.full_name = body.full_name
    if (body.role !== undefined) profileUpdates.role = body.role

    const { error } = await admin.from('profiles').update(profileUpdates).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update subscription if provided
  if (body.subscription_status !== undefined) {
    await admin
      .from('subscriptions')
      .update({ status: body.subscription_status, updated_at: new Date().toISOString() })
      .eq('user_id', params.id)
  }

  return NextResponse.json({ success: true })
}
