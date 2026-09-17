'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import FreeUserBanner from '@/components/FreeUserBanner'
import { supabase } from '@/lib/supabase'
import { fetchProfilePayload } from '@/lib/profile-client'
import { hasOsteoupgrade } from '@/lib/entitlements'
import { LIBELLES_LICENCE, type Questionnaire } from '@/lib/questionnaires'
import { ArrowLeft, ArrowRight, ClipboardList, Clock, Loader2, Lock } from 'lucide-react'

export default function QuestionnairesPage() {
  const router = useRouter()
  const [chargement, setChargement] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [liste, setListe] = useState<Questionnaire[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const payload = await fetchProfilePayload()
        if (!payload?.user) {
          router.push('/')
          return
        }
        setProfile(payload.profile)

        const { data } = await supabase
          .from('questionnaires')
          .select('*')
          .eq('status', 'published')
          .order('order_index', { ascending: true })
        setListe((data || []) as Questionnaire[])
      } catch (error) {
        console.error('Chargement des questionnaires:', error)
      } finally {
        setChargement(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ouvert = hasOsteoupgrade(profile)

  if (chargement) {
    return (
      <AuthLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {!ouvert && <FreeUserBanner />}

        <Link
          href="/outils"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Outils du praticien
        </Link>

        <header>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <ClipboardList className="h-6 w-6 text-violet-600" />
            Questionnaires cliniques
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Passation, calcul du score et conduite qui en découle. Rien n'est enregistré : le
            résultat s'affiche, se copie, et disparaît quand vous quittez la page.
          </p>
        </header>

        <div className="space-y-3">
          {liste.map((questionnaire) => (
            <Carte key={questionnaire.id} questionnaire={questionnaire} ouvert={ouvert} />
          ))}
          {liste.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Aucun questionnaire publié pour l'instant.
            </p>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}

function Carte({ questionnaire, ouvert }: { questionnaire: Questionnaire; ouvert: boolean }) {
  const contenu = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
          {questionnaire.code}
        </span>
        <h2 className="font-semibold text-slate-900">{questionnaire.name}</h2>
        {questionnaire.duration_minutes && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {questionnaire.duration_minutes} min
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-slate-600">{questionnaire.purpose}</p>
      {!questionnaire.traduction_officielle && (
        <p className="mt-2 text-xs text-amber-700">
          Formulation fidèle, mais pas la traduction officiellement validée.
          {questionnaire.licence_statut !== 'libre' && questionnaire.licence_statut !== 'obtenue' && (
            <> {LIBELLES_LICENCE[questionnaire.licence_statut]}.</>
          )}
        </p>
      )}
    </>
  )

  if (!ouvert) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 opacity-70">
        {contenu}
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          Réservé aux abonnés
        </p>
      </div>
    )
  }

  return (
    <Link
      href={`/outils/questionnaires/${questionnaire.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-violet-300"
    >
      {contenu}
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700">
        Faire passer
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
