import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'
import { STUDENT_BUCKET, deleteStudentDocument, revokeStudentDiscount } from '@/lib/student-offer'
import { logCustomerEvent } from '@/lib/customer-events'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// GET /api/admin/student-verifications : toutes les demandes, les plus
// récentes d'abord. Avec ?document=<id> : URL signée (60 s) du justificatif.
export async function GET(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const documentId = new URL(request.url).searchParams.get('document')
  if (documentId) {
    const { data: v } = await supabaseAdmin
      .from('student_verifications').select('document_path').eq('id', documentId).maybeSingle()
    if (!v?.document_path) return NextResponse.json({ error: 'Justificatif supprimé ou introuvable.' }, { status: 404 })
    const { data, error } = await supabaseAdmin.storage.from(STUDENT_BUCKET).createSignedUrl(v.document_path, 60)
    if (error || !data) return NextResponse.json({ error: 'Lien indisponible.' }, { status: 500 })
    return NextResponse.json({ url: data.signedUrl })
  }

  const { data, error } = await supabaseAdmin
    .from('student_verifications')
    .select('*, profile:profiles(email, full_name, plan, subscription_status, trial_ends_at, billing_interval)')
    .order('submitted_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ verifications: data ?? [] })
}

// POST /api/admin/student-verifications { id, decision: 'approve' | 'reject', reason? }
export async function POST(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, decision, reason } = await request.json()
  if (!id || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'id et decision requis' }, { status: 400 })
  }
  const motif = typeof reason === 'string' ? reason.trim().slice(0, 500) : ''
  if (decision === 'reject' && !motif) {
    return NextResponse.json({ error: 'Indiquez le motif du refus : il figure dans l’email envoyé.' }, { status: 400 })
  }

  const { data: v } = await supabaseAdmin
    .from('student_verifications')
    .select('*, profile:profiles(email, full_name)')
    .eq('id', id)
    .maybeSingle()
  if (!v) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (v.status !== 'pending') return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 })

  const profil = (v as any).profile as { email: string; full_name: string | null } | null

  if (decision === 'approve') {
    await deleteStudentDocument(v.document_path)
    await supabaseAdmin.from('student_verifications').update({
      status: 'approved', decided_at: new Date().toISOString(), decided_by: admin.id, document_path: null,
    }).eq('id', id)
    if (profil?.email) {
      await logCustomerEvent({
        userId: v.user_id, email: profil.email, type: 'other', source: 'admin',
        comment: 'Justificatif étudiant validé',
      })
    }
    return NextResponse.json({ success: true, status: 'approved' })
  }

  // Refus : retirer la remise et, si la première année est déjà payée,
  // facturer la différence. Fait AVANT de marquer la demande : si Stripe
  // échoue, la demande reste en attente et le refus peut être relancé.
  let regularisation = 0
  if (v.stripe_subscription_id) {
    try {
      regularisation = await revokeStudentDiscount(v.stripe_subscription_id)
    } catch (err: any) {
      console.error('[student-verifications] retrait de la remise:', err?.message)
      return NextResponse.json(
        { error: `Stripe a refusé le retrait de la remise : ${err?.message ?? 'erreur inconnue'}. Rien n'a été modifié.` },
        { status: 502 }
      )
    }
    await supabaseAdmin.from('profiles')
      .update({ partner_discount_name: null })
      .eq('id', v.user_id)
      .eq('partner_discount_name', 'Tarif étudiant')
  }

  await deleteStudentDocument(v.document_path)
  await supabaseAdmin.from('student_verifications').update({
    status: 'rejected', decided_at: new Date().toISOString(), decided_by: admin.id,
    document_path: null, rejection_reason: motif, regularisation_amount: regularisation,
  }).eq('id', id)

  if (profil?.email) {
    await logCustomerEvent({
      userId: v.user_id, email: profil.email, type: 'other', source: 'admin',
      comment: `Justificatif étudiant refusé : ${motif}`,
      amountCents: regularisation || null,
    })

    // Email « Justificatif étudiant refusé » (automatisation en base).
    const montant = (regularisation / 100).toFixed(2).replace('.', ',')
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          event: 'Justificatif étudiant refusé',
          contact_email: profil.email,
          full_name: profil.full_name,
          metadata: {
            motif,
            consequence: !v.stripe_subscription_id
              ? "Le tarif étudiant n'est donc pas disponible sur votre compte. Vous pouvez déposer un nouveau justificatif depuis votre espace abonnement."
              : regularisation > 0
                ? `Votre abonnement passe au plein tarif. La remise étudiant déjà accordée sur votre première année, soit ${montant} €, fait l'objet d'une facture de régularisation prélevée sur votre moyen de paiement.`
                : "Votre abonnement passe au plein tarif : votre premier prélèvement, à la fin de votre essai gratuit, se fera au tarif annuel standard. Vous pouvez résilier d'ici là depuis votre espace abonnement.",
          },
        }),
      })
    } catch {
      console.error('[student-verifications] email de refus non déclenché')
    }
  }

  return NextResponse.json({ success: true, status: 'rejected', regularisation })
}
