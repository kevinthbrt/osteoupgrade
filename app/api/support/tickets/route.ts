import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyAdmin } from '@/lib/admin-notify'
import { sendTransactionalEmail } from '@/lib/mailing'

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

    await notifyAdmin('other', `[Support] Nouveau ticket : ${title.trim()}`, `De : ${user.email}`)

    const adminEmail = process.env.ADMIN_EMAIL || 'contact@osteo-upgrade.fr'
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `[Support] ${title.trim()}`,
      html: buildAdminEmailHtml(title.trim(), message.trim(), user.email!, 'OsteoUpgrade', attachment_name),
      skipUnsubscribeFooter: true,
    })

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
    .select('*')
    .eq('user_email', user.email!)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets })
}

function buildAdminEmailHtml(title: string, message: string, email: string, source: string, attachmentName?: string | null) {
  const base = process.env.NEXT_PUBLIC_URL || 'https://osteoupgrade.vercel.app'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f172a;margin:0 0 4px;">Nouveau ticket support</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:12px;">Source : ${source}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:14px;"><strong>De :</strong> ${email}</p>
      <p style="margin:0 0 8px;color:#0f172a;font-size:15px;font-weight:600;">${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0;white-space:pre-wrap;color:#1e293b;font-size:14px;line-height:1.6;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      ${attachmentName ? `<p style="color:#64748b;font-size:13px;"><strong>Pièce jointe :</strong> ${attachmentName}</p>` : ''}
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Gérer les tickets → <a href="${base}/admin/support">Admin Support</a></p>
    </div>
  `
}
