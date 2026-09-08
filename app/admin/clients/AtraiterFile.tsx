'use client'

import { Mail, MessageSquareQuote, Wrench, CheckCircle2 } from 'lucide-react'
import { planLabel, planOf } from '@/lib/entitlements'
import { URGENCE_STYLES, lifecycleLabel, signauxDe, type Signal } from '@/lib/customer-tracking'

/**
 * File d'attente : les seuls comptes sur lesquels il y a quelque chose à
 * faire, du plus urgent au moins urgent.
 *
 * C'est ce qui manquait au module. Une liste de trente-six comptes triée par
 * date d'inscription ne dit pas par où commencer ; celle-ci ne montre que ce
 * qui a une raison d'être fait aujourd'hui, avec cette raison écrite en clair
 * à côté du nom.
 */
export default function AtraiterFile({
  clients,
  onOuvrir,
  onEcrire,
  onEnquete,
}: {
  clients: any[]
  onOuvrir: (id: string) => void
  onEcrire: (client: any) => void
  onEnquete: (client: any) => void
}) {
  const maintenant = Date.now()

  const aTraiter = clients
    .map((c) => ({ client: c, signaux: signauxDe(c, maintenant) }))
    .filter((l) => l.signaux.length > 0)
    .sort((a, b) => {
      const urgence = a.signaux[0].urgence - b.signaux[0].urgence
      if (urgence !== 0) return urgence
      // À urgence égale, le plus de signaux d'abord : un compte qui cumule
      // impayé et silence mérite l'appel avant celui qui n'a qu'un motif.
      return b.signaux.length - a.signaux.length
    })

  if (aTraiter.length === 0) {
    return (
      <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl p-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-lg font-bold text-slate-800">Rien à traiter aujourd'hui</p>
        <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
          Aucun essai sur le point de finir, aucun impayé, aucun départ récent sans explication, aucune
          réponse laissée sans suite. La liste complète reste accessible dans l'onglet Clients.
        </p>
      </div>
    )
  }

  const parUrgence = (n: number) => aTraiter.filter((l) => l.signaux[0].urgence === n).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4] as const).map((u) =>
          parUrgence(u) ? (
            <span
              key={u}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${URGENCE_STYLES[u].badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${URGENCE_STYLES[u].point}`} />
              {URGENCE_STYLES[u].libelle}
              <span className="opacity-60">{parUrgence(u)}</span>
            </span>
          ) : null
        )}
      </div>

      <div className="space-y-3">
        {aTraiter.map(({ client, signaux }) => (
          <div
            key={client.id}
            className="rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/70 shadow-lg p-5 flex flex-col md:flex-row md:items-start gap-4"
          >
            <span
              className={`h-3 w-3 rounded-full shrink-0 mt-1.5 ${URGENCE_STYLES[signaux[0].urgence].point}`}
              title={URGENCE_STYLES[signaux[0].urgence].libelle}
            />

            <div className="min-w-0 flex-1">
              <button onClick={() => onOuvrir(client.id)} className="text-left">
                <p className="font-bold text-slate-800 hover:text-violet-700 transition-colors">
                  {client.full_name || client.email}
                </p>
                <p className="text-xs text-slate-400">
                  {client.email} · {planLabel(planOf(client))} ·{' '}
                  {lifecycleLabel(client.lifecycle_stage).label}
                </p>
              </button>

              <div className="mt-3 space-y-1.5">
                {signaux.map((s: Signal) => (
                  <div key={s.key} className="flex items-start gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${URGENCE_STYLES[s.urgence].badge}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-sm text-slate-600">{s.raison}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {signaux[0].action === 'enquete' ? (
                <button
                  onClick={() => onEnquete(client)}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 inline-flex items-center gap-2"
                >
                  <MessageSquareQuote className="h-4 w-4" /> Demander pourquoi
                </button>
              ) : signaux[0].action === 'corriger' ? (
                <button
                  onClick={() => onOuvrir(client.id)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 inline-flex items-center gap-2"
                >
                  <Wrench className="h-4 w-4" /> Voir la fiche
                </button>
              ) : (
                <button
                  onClick={() => onEcrire(client)}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 inline-flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" /> Écrire
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Un signal s'éteint de lui-même dès qu'un contact lui est postérieur, email envoyé d'ici ou action
        consignée à la main. Rien à cocher.
      </p>
    </div>
  )
}
