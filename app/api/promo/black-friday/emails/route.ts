import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isAdminOrCron } from '@/lib/api-guards'
import { offerOf, formatAmount } from '@/lib/offers'
import { planOf } from '@/lib/entitlements'
import { triggerAutomations, type TriggerEvent } from '@/lib/automation-triggers'
import { isBlackFridayActive, blackFridayFirstYearAmount } from '@/lib/black-friday'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const CAMPAGNE = 'black_friday_2026'

/** Jour de la relance « dernier jour », date de Paris. */
const JOUR_RELANCE = '2026-11-30'

/**
 * Emails Black Friday aux adhérents mensuels (voir docs/BLACK_FRIDAY_2026.md).
 *
 * Appelée chaque matin par le cron Vercel (9 h, heure de Paris). Hors de la
 * période, elle ne fait rien : il n'y a rien à désactiver après le 30.
 *
 *   - du 23 au 29 novembre : email de lancement, une fois par adhérent. Un
 *     adhérent qui passe au mensuel en cours de semaine le reçoit le
 *     lendemain matin ;
 *   - le 30 novembre : relance « dernier jour », à ceux qui sont toujours au
 *     mois (un passage à l'annuel écrit `billing_interval = 'year'` via le
 *     webhook, ce qui les exclut d'office).
 *
 * Destinataires : abonnés payants (`active`) au mois, hors fondateurs,
 * comptes offerts et désinscrits. L'envoi lui-même passe par les séquences
 * (`mail_automations`) : gabarits modifiables depuis l'administration.
 *
 * Un admin connecté peut appeler `?apercu=1` pour compter les destinataires
 * sans rien envoyer.
 */
export async function GET(request: Request) {
  if (!(await isAdminOrCron(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const apercu = new URL(request.url).searchParams.get('apercu') === '1'
  const maintenant = new Date()

  if (!isBlackFridayActive(maintenant)) {
    return NextResponse.json({ envoyes: 0, raison: 'Hors période Black Friday' })
  }

  const jourParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(maintenant)
  const relance = jourParis === JOUR_RELANCE
  const type = relance ? 'dernier_jour' : 'lancement'
  const evenement: TriggerEvent = relance ? 'Black Friday 2026 - Dernier jour' : 'Black Friday 2026 - Lancement'

  const { data: profils, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, plan, role, billing_interval, is_founding_member, is_complimentary, newsletter_opt_in')
    .eq('subscription_status', 'active')
    .in('plan', ['osteoflow', 'osteoupgrade', 'bundle'])
    .or('billing_interval.is.null,billing_interval.eq.month')
    .not('stripe_subscription_id', 'is', null)
    .not('email', 'is', null)

  if (error) {
    console.error('🖤 Black Friday emails: lecture des profils impossible:', error.message)
    return NextResponse.json({ error: 'Lecture des profils impossible' }, { status: 500 })
  }

  const candidats = (profils ?? []).filter(
    (p) => !p.is_founding_member && !p.is_complimentary && p.newsletter_opt_in !== false
  )

  // Désinscrits de la liste de diffusion : la désinscription passe par
  // `mail_contacts`, qui ne recoupe pas toujours `newsletter_opt_in`.
  const emails = candidats.map((p) => p.email as string)
  const desinscrits = new Set<string>()
  for (let i = 0; i < emails.length; i += 200) {
    const { data } = await supabaseAdmin
      .from('mail_contacts')
      .select('email')
      .in('email', emails.slice(i, i + 200))
      .eq('status', 'unsubscribed')
    for (const c of data ?? []) desinscrits.add(c.email)
  }

  const destinataires = candidats.filter((p) => !desinscrits.has(p.email as string))

  if (apercu) {
    const { data: deja } = await supabaseAdmin
      .from('promo_email_sends')
      .select('user_id')
      .eq('campaign', CAMPAGNE)
      .eq('email_kind', type)
    const dejaEnvoyes = new Set((deja ?? []).map((d) => d.user_id))
    return NextResponse.json({
      apercu: true,
      type,
      destinataires: destinataires.filter((p) => !dejaEnvoyes.has(p.id)).length,
      deja_envoyes: dejaEnvoyes.size,
    })
  }

  let envoyes = 0
  const erreurs: string[] = []

  for (const profil of destinataires) {
    const offre = offerOf(planOf(profil))
    if (!offre) continue

    // Le journal est écrit AVANT l'inscription à la séquence : deux exécutions
    // simultanées du cron ne peuvent pas envoyer deux fois. En cas d'échec,
    // la ligne est retirée pour que le passage suivant réessaie.
    const { data: reserve, error: erreurJournal } = await supabaseAdmin
      .from('promo_email_sends')
      .upsert(
        { campaign: CAMPAGNE, email_kind: type, user_id: profil.id },
        { onConflict: 'campaign,email_kind,user_id', ignoreDuplicates: true }
      )
      .select('user_id')
    if (erreurJournal) {
      erreurs.push(erreurJournal.message)
      continue
    }
    if (!reserve || reserve.length === 0) continue // déjà envoyé

    const prixBf = blackFridayFirstYearAmount(offre)
    const resultat = await triggerAutomations(evenement, {
      contact_email: profil.email as string,
      full_name: profil.full_name,
      metadata: {
        offre: offre.name,
        prix_bf: formatAmount(prixBf),
        prix_annuel: `${formatAmount(offre.annualAmount)}/an`,
        prix_mensuel_12: formatAmount(offre.monthlyAmount * 12),
        economie: formatAmount(offre.monthlyAmount * 12 - prixBf),
      },
    })

    if (resultat.enrolled > 0) {
      envoyes++
    } else {
      erreurs.push(...resultat.errors)
      await supabaseAdmin
        .from('promo_email_sends')
        .delete()
        .eq('campaign', CAMPAGNE)
        .eq('email_kind', type)
        .eq('user_id', profil.id)
    }
  }

  if (erreurs.length > 0) console.error('🖤 Black Friday emails: erreurs', erreurs.slice(0, 5))

  return NextResponse.json({ type, destinataires: destinataires.length, envoyes, erreurs: erreurs.length })
}
