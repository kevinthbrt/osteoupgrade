import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { title, message, attachment_url, attachment_name, attachment_size } = await req.json()
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 })
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        title: title.trim(),
        message: message.trim(),
        status: 'pending',
        source: 'osteoupgrade',
        user_email: user.email!,
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        attachment_size: attachment_size || null,
      })
      .select()
      .single()

    if (error) throw error

    // Insert the initial user message into the conversation thread
    await supabaseAdmin
      .from('support_messages')
      .insert({ ticket_id: ticket.id, sender: 'user', content: message.trim() })

    return NextResponse.json({ ticket })
  } catch (err) {
    console.error('Support ticket creation error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*, messages:support_messages(id, sender, content, created_at)')
    .eq('user_email', user.email!)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort messages chronologically within each ticket
  const sorted = (tickets || []).map(t => ({
    ...t,
    messages: (t.messages || []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  return NextResponse.json({ tickets: sorted })
}
