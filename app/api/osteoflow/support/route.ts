import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getOsteoflowSessionUser } from '@/lib/osteoflow-auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const tokenUser = await getOsteoflowSessionUser(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, message, attachment_b64, attachment_name, attachment_type, attachment_size } = await req.json()
    const user_email = tokenUser.email
    const license_email = tokenUser.email

    if (!title?.trim() || !message?.trim() || !user_email?.trim()) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    let attachmentUrl: string | null = null
    if (attachment_b64 && attachment_name) {
      const buffer = Buffer.from(attachment_b64, 'base64')
      const ext = attachment_name.split('.').pop() || 'bin'
      const blob = await put(`support/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`, buffer, {
        access: 'public',
        contentType: attachment_type || 'application/octet-stream',
      })
      attachmentUrl = blob.url
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        title: title.trim(),
        message: message.trim(),
        status: 'pending',
        source: 'osteoflow',
        user_email: user_email.trim(),
        license_email: license_email?.trim() || null,
        attachment_url: attachmentUrl,
        attachment_name: attachment_name || null,
        attachment_size: attachment_size || null,
      })
      .select()
      .single()

    if (error) throw error

    // Insert initial user message in thread
    await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticket.id,
      sender: 'user',
      content: message.trim(),
    })

    return NextResponse.json({ ticket })
  } catch (err) {
    console.error('Osteoflow support ticket error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const tokenUser = await getOsteoflowSessionUser(req)
  if (!tokenUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = tokenUser.email

  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('id, title, message, status, created_at, attachment_name, last_admin_message_at, admin_reply, admin_replied_at')
    .or(`license_email.eq.${email},user_email.eq.${email}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tickets: tickets || [] })
}
