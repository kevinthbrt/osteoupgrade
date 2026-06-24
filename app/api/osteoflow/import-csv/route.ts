import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/mailing'

const OSTEOFLOW_SECRET = process.env.OSTEOFLOW_PROXY_SECRET || 'a8c0fcc6aa558582564131768fd6aa6b0628b84ac0abe494948b088f086be1a6'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-osteoflow-secret')
  if (secret !== OSTEOFLOW_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData() as unknown as FormData
    const email = (formData.get('email') as string | null)?.trim()
    const file = formData.get('file') as File | null

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const filename = file.name || 'import.csv'

    const adminEmail = process.env.ADMIN_EMAIL || 'contact@osteo-upgrade.fr'

    await sendTransactionalEmail({
      to: adminEmail,
      subject: `[MyOsteoFlow] Demande d'import CSV — ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Nouvelle demande d'import CSV</h2>
          <p style="margin:0 0 8px;color:#64748b;font-size:14px;"><strong>De :</strong> ${email}</p>
          <p style="margin:0 0 8px;color:#64748b;font-size:14px;"><strong>Fichier :</strong> ${filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)} Ko)</p>
          <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;color:#0c4a6e;font-size:14px;line-height:1.6;">
              Le fichier CSV est joint à cet email. Transformez-le puis renvoyez-le à <strong>${email}</strong>.
            </p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reçu via MyOsteoFlow — demande d'import CSV</p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: base64,
          type: file.type || 'text/csv',
          disposition: 'attachment',
        },
      ],
      skipUnsubscribeFooter: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Import CSV error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
