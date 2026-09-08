import { supabaseAdmin } from '@/lib/supabase-server'
import { SURVEY_DEFINITIONS, type SurveyKind } from '@/lib/customer-tracking'
import FormulaireAvis from './FormulaireAvis'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Votre avis', robots: { index: false, follow: false } }

/**
 * Page publique de réponse à une enquête (/avis/<token>).
 *
 * Rendue côté serveur avec la clé service-role, comme les pages funnel :
 * `customer_surveys` n'a aucune politique `anon`, rien n'est lisible depuis
 * le navigateur. Le jeton est la seule clé, il n'ouvre que cette question.
 */
export default async function PageAvis({ params }: { params: { token: string } }) {
  const { data: survey } = await supabaseAdmin
    .from('customer_surveys')
    .select('kind, question, responded_at, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  const expire = survey?.expires_at ? new Date(survey.expires_at) < new Date() : false

  if (!survey || expire) {
    return (
      <Cadre titre="Ce lien n'est plus valable">
        <p className="text-slate-600">
          Le lien que vous avez suivi n'existe pas ou a expiré. Vous pouvez nous écrire directement à
          l'adresse depuis laquelle vous avez reçu cet email : nous lisons tout.
        </p>
      </Cadre>
    )
  }

  if (survey.responded_at) {
    return (
      <Cadre titre="Merci, c'est bien noté">
        <p className="text-slate-600">
          Votre réponse nous est déjà parvenue. Elle est lue, et elle compte.
        </p>
      </Cadre>
    )
  }

  const def = SURVEY_DEFINITIONS[survey.kind as SurveyKind] ?? SURVEY_DEFINITIONS.autre

  return (
    <Cadre titre={survey.question}>
      <FormulaireAvis
        token={params.token}
        choices={def.choices}
        askRating={def.askRating}
      />
    </Cadre>
  )
}

function Cadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-violet-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-8 py-7 text-center">
          <div className="text-3xl">💬</div>
          <h1 className="mt-3 text-xl font-bold text-white">{titre}</h1>
        </div>
        <div className="p-8">{children}</div>
        <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-400">
          L'équipe OsteoUpgrade × MyOsteoflow
        </div>
      </div>
    </div>
  )
}
