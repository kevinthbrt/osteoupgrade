import { NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/mailing'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, html, text, from, tags } = body

    const recipients = (Array.isArray(to) ? to : String(to || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)) as string[]

    if (!recipients.length) {
      return NextResponse.json({ error: 'Destinataires manquants.' }, { status: 400 })
    }

    if (!subject || !html) {
      return NextResponse.json({ error: 'Sujet et contenu HTML sont requis.' }, { status: 400 })
    }

    const result = await sendTransactionalEmail({
      to: recipients,
      subject,
      html,
      text,
      from,
      tags
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Mailing send error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
