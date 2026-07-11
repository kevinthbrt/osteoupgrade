import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/mailing'
import { notifyAdmin } from '@/lib/admin-notify'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Anti-spam : 5 signalements / 5 min / IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfter } = rateLimit(`bug-report:${ip}`, { limit: 5, windowSeconds: 300 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de signalements. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { email, message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'contact@osteo-upgrade.fr'
    const userLine = email?.trim()
      ? `<p style="margin:0 0 8px;color:#64748b;font-size:14px;"><strong>De :</strong> ${email.trim()}</p>`
      : `<p style="margin:0 0 8px;color:#94a3b8;font-size:14px;font-style:italic;">Email non fourni</p>`

    const notifBody = email?.trim() ? `De : ${email.trim()} — ${message.trim().slice(0, 120)}` : message.trim().slice(0, 120)
    await notifyAdmin('bug_report', 'Signalement de bug', notifBody)

    await sendTransactionalEmail({
      to: adminEmail,
      subject: `[Bêta] Signalement de bug`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Nouveau signalement de bug</h2>
          ${userLine}
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;white-space:pre-wrap;color:#1e293b;font-size:14px;line-height:1.6;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reçu via le formulaire de signalement bêta — OsteoUpgrade</p>
        </div>
      `,
      skipUnsubscribeFooter: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Bug report error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
