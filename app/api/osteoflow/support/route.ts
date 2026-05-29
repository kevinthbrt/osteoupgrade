import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyAdmin } from '@/lib/admin-notify'
import { sendTransactionalEmail } from '@/lib/mailing'
import { put } from '@vercel/blob'

const OSTEOFLOW_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

function checkSecret(req: NextRequest) {
  return req.headers.get('x-osteoflow-secret') === OSTEOFLOW_SECRET
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, message, user_email, license_email, attachment_b64, attachment_name, attachment_type, attachment_size } = await req.json()

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

    await notifyAdmin('other', `[Support MyOsteoFlow] ${title.trim()}`, `De : ${user_email}`)

    const adminEmail = process.env.ADMIN_EMAIL || 'contact@osteo-upgrade.fr'
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `[Support MyOsteoFlow] ${title.trim()}`,
      html: buildAdminEmailHtml(title.trim(), message.trim(), user_email.trim(), attachment_name),
      skipUnsubscribeFooter: true,
    })

    return NextResponse.json({ ticket })
  } catch (err) {
    console.error('Osteoflow support ticket error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const licenseEmail = req.nextUrl.searchParams.get('license_email')
  const userEmail = req.nextUrl.searchParams.get('user_email')

  if (!licenseEmail && !userEmail) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (licenseEmail) {
    query = query.eq('license_email', licenseEmail)
  } else {
    query = query.eq('user_email', userEmail!)
  }

  const { data: tickets, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tickets })
}

function buildAdminEmailHtml(title: string, message: string, email: string, attachmentName?: string | null) {
  const base = process.env.NEXT_PUBLIC_URL || 'https://osteoupgrade.vercel.app'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f172a;margin:0 0 4px;">Nouveau ticket support — MyOsteoFlow</h2>
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
