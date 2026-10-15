'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import { GraduationCap, Loader2, FileText, Check, X, AlertCircle } from 'lucide-react'
import { planLabel, isPlan } from '@/lib/entitlements'

interface Verification {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  document_path: string | null
  document_name: string | null
  submitted_at: string
  stripe_subscription_id: string | null
  discount_applied_at: string | null
  decided_at: string | null
  rejection_reason: string | null
  regularisation_amount: number | null
  profile: {
    email: string
    full_name: string | null
    plan: string | null
    subscription_status: string | null
    trial_ends_at: string | null
  } | null
}

const STATUTS = {
  pending: { label: 'À vérifier', classe: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Validé', classe: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', classe: 'bg-red-100 text-red-700' },
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '')

/**
 * Vérification des justificatifs du tarif étudiant (cf. docs/OFFRE_ETUDIANT.md).
 *
 * Valider supprime le justificatif. Refuser le supprime aussi, retire la
 * remise de l'abonnement et, si la première année est déjà payée, facture la
 * différence ; l'étudiant reçoit un email avec le motif.
 */
export default function AdminEtudiantsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [demandes, setDemandes] = useState<Verification[]>([])
  const [enCours, setEnCours] = useState<string | null>(null)
  const [motifs, setMotifs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const charger = async () => {
    const res = await fetch('/api/admin/student-verifications')
    if (res.ok) setDemandes((await res.json()).verifications || [])
  }

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }
      await charger()
      setLoading(false)
    })()
  }, [router])

  const ouvrirJustificatif = async (id: string) => {
    setErreur(null)
    const res = await fetch(`/api/admin/student-verifications?document=${id}`)
    const data = await res.json()
    if (!res.ok) { setErreur(data.error); return }
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  const decider = async (v: Verification, decision: 'approve' | 'reject') => {
    setErreur(null)
    setMessage(null)
    const motif = (motifs[v.id] || '').trim()
    if (decision === 'reject') {
      if (!motif) { setErreur('Indiquez le motif du refus : il figure dans l’email envoyé à l’étudiant.'); return }
      const consequence = v.stripe_subscription_id
        ? v.profile?.subscription_status === 'trialing'
          ? 'La remise sera retirée : le premier prélèvement, à la fin de l’essai, se fera au plein tarif.'
          : 'La remise sera retirée et la différence déjà accordée sera facturée immédiatement.'
        : 'Aucun abonnement n’a encore été souscrit : rien ne sera facturé.'
      if (!confirm(`Refuser le justificatif de ${v.profile?.email} ?\n\n${consequence}\nUn email avec le motif lui sera envoyé.`)) return
    }
    setEnCours(v.id)
    try {
      const res = await fetch('/api/admin/student-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, decision, reason: motif }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(
        decision === 'approve'
          ? 'Justificatif validé et supprimé.'
          : data.regularisation > 0
            ? `Justificatif refusé : ${(data.regularisation / 100).toFixed(2).replace('.', ',')} € de régularisation facturés, email envoyé.`
            : 'Justificatif refusé, email envoyé.'
      )
      await charger()
    } catch (err: any) {
      setErreur(err.message || 'Erreur')
    } finally {
      setEnCours(null)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  const aVerifier = demandes.filter((d) => d.status === 'pending')
  const traitees = demandes.filter((d) => d.status !== 'pending')

  const Carte = ({ v }: { v: Verification }) => {
    const statut = STATUTS[v.status]
    const offre = isPlan(v.profile?.plan) ? planLabel(v.profile!.plan as any) : null
    return (
      <div className="bg-white/80 border border-blue-100/60 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">{v.profile?.full_name || v.profile?.email}</p>
            <p className="text-xs text-gray-500">
              {v.profile?.email} · déposé le {date(v.submitted_at)}
              {v.discount_applied_at
                ? ` · abonné ${offre ?? ''} au tarif étudiant${v.profile?.subscription_status === 'trialing' && v.profile.trial_ends_at ? `, essai jusqu’au ${date(v.profile.trial_ends_at)}` : ''}`
                : ' · pas encore abonné'}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statut.classe}`}>{statut.label}</span>
        </div>

        {v.status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => ouvrirJustificatif(v.id)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Voir le justificatif{v.document_name ? ` (${v.document_name})` : ''}
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={motifs[v.id] || ''}
                onChange={(e) => setMotifs((m) => ({ ...m, [v.id]: e.target.value }))}
                placeholder="Motif en cas de refus (envoyé à l’étudiant)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                disabled={enCours === v.id}
                onClick={() => decider(v, 'approve')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {enCours === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Valider
              </button>
              <button
                type="button"
                disabled={enCours === v.id}
                onClick={() => decider(v, 'reject')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Refuser
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">
            Décidé le {date(v.decided_at)}
            {v.rejection_reason ? ` · motif : ${v.rejection_reason}` : ''}
            {v.regularisation_amount ? ` · régularisation : ${(v.regularisation_amount / 100).toFixed(2).replace('.', ',')} €` : ''}
            {' '}· justificatif supprimé
          </p>
        )}
      </div>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <AdminBackButton />
          <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8">
            <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Admin · Étudiants
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Tarif étudiant</h1>
            <p className="text-white/60 text-sm mt-2">
              -50 % la première année sur les offres annuelles, débloqué dès le dépôt du justificatif.
              Vérifiez de préférence pendant les 7 jours d’essai : un refus à ce stade ne facture rien de plus.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 space-y-6">
          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {erreur}
            </div>
          )}
          {message && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">{message}</div>}

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">À vérifier ({aVerifier.length})</h2>
            {aVerifier.length === 0
              ? <p className="text-sm text-gray-500">Aucun justificatif en attente.</p>
              : aVerifier.map((v) => <Carte key={v.id} v={v} />)}
          </section>

          {traitees.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Déjà traités</h2>
              {traitees.map((v) => <Carte key={v.id} v={v} />)}
            </section>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
