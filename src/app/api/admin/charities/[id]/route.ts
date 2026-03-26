// app/api/admin/charities/[id]/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params   // ✅ await the params

  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name', 'description', 'website_url', 'image_url', 'is_featured', 'is_active']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k]
  }

  const { data, error } = await admin
    .from('charities')
    .update(updates)
    .eq('id', id)           // ✅ use awaited id, not params.id
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ charity: data })
}

// DELETE — also update this one while you're here
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }   // ✅ Promise type in Next.js 15
) {
  const { id } = await params

  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin
    .from('charities')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)           // ✅ use awaited id

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}