import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * GET /api/mailing/unsubscribe?token=<base64-encoded-email>
 * Unsubscribe a user from marketing emails (newsletter).
 * Updates both mail_contacts.status and profiles.newsletter_opt_in.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return new Response(renderUnsubscribePage('error', 'Lien de désinscription invalide.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    let email: string
    try {
      email = Buffer.from(token, 'base64').toString('utf-8')
    } catch {
      return new Response(renderUnsubscribePage('error', 'Lien de désinscription invalide.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    if (!email || !email.includes('@')) {
      return new Response(renderUnsubscribePage('error', 'Lien de désinscription invalide.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Update mail_contacts status to unsubscribed
    await supabaseAdmin
      .from('mail_contacts')
      .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
      .eq('email', email)

    // Update profiles newsletter_opt_in to false
    await supabaseAdmin
      .from('profiles')
      .update({ newsletter_opt_in: false, updated_at: new Date().toISOString() })
      .eq('email', email)

    return new Response(renderUnsubscribePage('success', email), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return new Response(renderUnsubscribePage('error', 'Une erreur est survenue. Veuillez réessayer.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}

function renderUnsubscribePage(status: 'success' | 'error', detail: string): string {
  const isSuccess = status === 'success'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Désinscription confirmée' : 'Erreur'} - OsteoUpgrade</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 480px; width: 90%; padding: 40px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #1f2937; font-size: 24px; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; }
    .link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? '✅' : '❌'}</div>
    <h1>${isSuccess ? 'Désinscription confirmée' : 'Erreur'}</h1>
    ${isSuccess
      ? `<p>L'adresse <strong>${detail}</strong> a été retirée de notre liste de diffusion. Vous ne recevrez plus de newsletters.</p>
         <p style="margin-top: 24px;">Vous pouvez vous réinscrire à tout moment depuis vos <a href="https://www.osteo-upgrade.fr/settings" class="link">paramètres</a>.</p>`
      : `<p>${detail}</p>`
    }
    <p style="margin-top: 32px;"><a href="https://www.osteo-upgrade.fr" class="link">Retour au site</a></p>
  </div>
</body>
</html>`
}
