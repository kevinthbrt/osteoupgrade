import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { stripe, STRIPE_PLANS, FREE_TRIAL_DAYS, PUBLIC_PLAN_TYPES } from '@/lib/stripe'
import { planOf } from '@/lib/entitlements'
import { notifyAdmin } from '@/lib/admin-notify'
import { UTM_COOKIE, parseAttributionCookie, attributionToStripeMetadata } from '@/lib/utm'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { planType, referralCode, funnelSlug } = await request.json()

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const email = user.email

    console.log('📦 Stripe checkout request:', { planType, userId, email, referralCode })

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { planType: !!planType, userId: !!userId, email: !!email } },
        { status: 400 }
      )
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]

    console.log('📋 Plan selected:', plan)

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan type: ${planType}` },
        { status: 400 }
      )
    }

    if (!plan.priceId) {
      console.error('❌ Missing Price ID for plan:', planType)
      return NextResponse.json(
        {
          error: `Price ID not configured for ${planType}`,
          details: `Please set the corresponding STRIPE_PRICE environment variable`
        },
        { status: 400 }
      )
    }

    // 🛡️ Le Price ID vient d'une variable d'environnement : rien ne garantit
    // qu'elle pointe vers le bon tarif. Une variable intervertie ne provoque
    // aucune erreur : elle facture simplement le mauvais montant pour le
    // mauvais produit, et le webhook accorde ensuite l'offre du prix
    // réellement payé. C'est arrivé en production le 20/08/2026 :
    // STRIPE_PRICE_PREMIUM_MONTHLY portait le prix OsteoUpgrade, et un client
    // ayant choisi Premium a été débité de 29,99 € pour un accès partiel.
    //
    // On revérifie donc auprès de Stripe que le prix correspond bien à l'offre
    // demandée. En cas d'écart on refuse : un paiement qui échoue se rattrape,
    // un client facturé au mauvais tarif pour le mauvais produit, non.
    try {
      const priceStripe = await stripe.prices.retrieve(plan.priceId)
      const planDuPrix = priceStripe.metadata?.plan
      const ecarts: string[] = []

      if (planDuPrix && planDuPrix !== plan.plan) {
        ecarts.push(`offre ${planDuPrix} au lieu de ${plan.plan}`)
      }
      if (priceStripe.unit_amount !== plan.amount) {
        ecarts.push(`${priceStripe.unit_amount} centimes au lieu de ${plan.amount}`)
      }
      if (priceStripe.recurring?.interval !== plan.interval) {
        ecarts.push(`facturation ${priceStripe.recurring?.interval} au lieu de ${plan.interval}`)
      }

      if (ecarts.length > 0) {
        console.error('❌ Price mismatch for plan:', planType, plan.priceId, ecarts)
        try {
          await notifyAdmin(
            'other',
            'Tarif Stripe incohérent : souscription bloquée',
            `L'offre ${planType} pointe vers ${plan.priceId}, qui ne correspond pas : ${ecarts.join(' ; ')}. ` +
              `Vérifiez la variable d'environnement du prix. Aucune souscription n'est possible sur cette offre tant que ce n'est pas corrigé.`
          )
        } catch {
          // La notification ne doit jamais empêcher le refus.
        }
        return NextResponse.json(
          { error: 'Cette offre est momentanément indisponible. Notre équipe a été prévenue.' },
          { status: 503 }
        )
      }
    } catch (err: any) {
      // Prix introuvable côté Stripe : même conclusion, on ne facture pas à l'aveugle.
      if (err?.type === 'StripeInvalidRequestError') {
        console.error('❌ Price not found on Stripe:', plan.priceId)
        return NextResponse.json(
          { error: 'Cette offre est momentanément indisponible. Notre équipe a été prévenue.' },
          { status: 503 }
        )
      }
      // Panne réseau ou API Stripe indisponible : on laisse passer plutôt que
      // de bloquer toutes les souscriptions sur une vérification annexe.
      console.error('⚠️ Could not verify price consistency, proceeding:', err?.message)
    }

    // Les offres Fondateur (une par offre commerciale) sont réservées aux
    // comptes marqués comme tels : revérifié ici pour qu'elles ne soient
    // jamais accessibles en appelant l'API directement.
    if (plan.isFounding) {
      const { data: founderProfile } = await supabase
        .from('profiles')
        .select('is_founding_member')
        .eq('id', userId)
        .single()

      if (!founderProfile?.is_founding_member) {
        return NextResponse.json(
          { error: 'Cette offre est réservée aux membres fondateurs.' },
          { status: 403 }
        )
      }
    }

    // Valider le code de parrainage (applicable à l'offre unique)
    let referrerUserId = null
    const shouldProcessReferral = Boolean(referralCode)

    if (shouldProcessReferral) {
      // 🚫 VÉRIFIER QUE L'UTILISATEUR N'A JAMAIS ÉTÉ PARRAINÉ (1 fois AU TOTAL, pas par année)
      const { data: existingReferrals, error: existingError } = await supabaseAdmin
        .from('referral_transactions')
        .select('id, created_at')
        .eq('referred_user_id', userId)
        .limit(1)

      if (existingReferrals && existingReferrals.length > 0) {
        console.warn('⚠️ User already referred before:', userId)
        return NextResponse.json(
          {
            error: 'Vous avez déjà été parrainé',
            details: 'Un utilisateur ne peut être parrainé qu\'une seule fois au total.'
          },
          { status: 400 }
        )
      }

      // Valider le code de parrainage
      const { data: referralData, error: referralError } = await supabaseAdmin
        .from('referral_codes')
        .select('user_id, is_active')
        .eq('referral_code', referralCode.toUpperCase())
        .single()

      if (referralError || !referralData) {
        console.warn('⚠️ Invalid referral code:', referralCode)
        // Don't fail the checkout, just ignore the invalid code
      } else if (!referralData.is_active) {
        console.warn('⚠️ Inactive referral code:', referralCode)
      } else if (referralData.user_id === userId) {
        console.warn('⚠️ User trying to use their own referral code:', userId)
        return NextResponse.json(
          {
            error: 'Vous ne pouvez pas utiliser votre propre code de parrainage',
            details: 'Le code de parrainage doit être celui d\'un autre membre Premium.'
          },
          { status: 400 }
        )
      } else {
        // Vérifier que le parrain est toujours un membre Premium/Admin actif
        const { data: referrerProfile } = await supabaseAdmin
          .from('profiles')
          .select('role, plan')
          .eq('id', referralData.user_id)
          .single()

        if (!referrerProfile || (planOf(referrerProfile) === 'free' && referrerProfile.role !== 'admin')) {
          console.warn('⚠️ Referrer no longer has an active plan, ignoring referral code:', referralCode)
          // Ne pas bloquer le checkout : on ignore simplement le parrainage
        } else {
          referrerUserId = referralData.user_id
          console.log('✅ Valid referral code:', referralCode, 'Referrer:', referrerUserId)
        }
      }
    }

    // 🎁 Essai gratuit de 7 jours : réservé au premier abonnement d'un compte
    // free n'ayant JAMAIS été abonné auparavant (ni essai déjà utilisé, ni
    // abonnement payant passé : y compris résilié depuis, ce qui remet le
    // rôle à 'free' sans effacer subscription_start_date), et jamais aux
    // membres fondateurs (déjà sur une offre à -50% à vie, pas de raison de
    // cumuler avec un essai gratuit). La carte est exigée dès la souscription
    // (payment_method_collection: 'always') et sera prélevée automatiquement
    // à la fin de l'essai, sauf annulation.
    const { data: trialProfile } = await supabase
      .from('profiles')
      .select('role, plan, trial_used_at, subscription_start_date, is_founding_member')
      .eq('id', userId)
      .single()

    // L'essai est ouvert aux trois offres mensuelles, mais reste unique par
    // compte à vie : `trial_used_at` n'est pas remis à zéro d'une offre à
    // l'autre. Les tarifs Fondateur en restent exclus.
    const isEligibleForTrial =
      !plan.isFounding &&
      planOf(trialProfile) === 'free' &&
      !trialProfile?.trial_used_at &&
      !trialProfile?.subscription_start_date &&
      !trialProfile?.is_founding_member

    // Remise du funnel à appliquer, s'il y en a une de valide pour cette
    // adresse. Renseignée dans le bloc ci-dessous, lue à la création de la
    // session.
    let promotionCodeId: string | null = null

    // 🕒 Échéance du funnel.
    //
    // Le compte à rebours affiché sur la page n'engage que le navigateur : un
    // lien conservé, un onglet resté ouvert ou une horloge décalée suffisent à
    // atteindre cette route après la fin annoncée. Une offre présentée comme
    // fermée doit l'être réellement, sinon le décompte n'est qu'un décor.
    if (funnelSlug) {
      const { data: funnel } = await supabaseAdmin
        .from('funnels')
        .select('id, plan_type, content, deadline_mode, deadline_at, deadline_days, deadline_blocks_checkout')
        .eq('slug', String(funnelSlug))
        .eq('status', 'published')
        .maybeSingle()

      if (funnel) {
        // L'offre demandée doit être l'une de celles que la page présente :
        // sans cette vérification, le slug d'un funnel encore ouvert servirait
        // à valider n'importe quelle autre offre.
        //
        // « L'une de celles » et non « celle du funnel » : une page peut porter
        // deux offres, chaque bloc tarifs ou appel à l'action désignant la
        // sienne. Ne comparer qu'à l'offre par défaut refusait la seconde, en
        // silence, juste après la création du compte.
        //
        // Les offres mensuelles publiques passent toujours : n'importe qui peut
        // les prendre depuis la page des tarifs, et la page d'inscription permet
        // d'en changer. Seule une offre non publique (Fondateur) doit figurer sur
        // la page pour être acceptée sous ce funnel.
        const offresDeLaPage = new Set<string>(PUBLIC_PLAN_TYPES)
        if (funnel.plan_type) offresDeLaPage.add(funnel.plan_type)
        for (const bloc of Array.isArray(funnel.content) ? funnel.content : []) {
          if (bloc && typeof bloc.planType === 'string' && bloc.planType) {
            offresDeLaPage.add(bloc.planType)
          }
        }
        if (offresDeLaPage.size > 0 && !offresDeLaPage.has(planType)) {
          return NextResponse.json(
            { error: 'Cette offre ne correspond pas à la page dont vous venez.' },
            { status: 400 }
          )
        }

        let echeance: Date | null = null

        if (funnel.deadline_mode === 'fixed' && funnel.deadline_at) {
          echeance = new Date(funnel.deadline_at)
        } else if (funnel.deadline_mode === 'relative') {
          // Échéance individuelle : celle figée à l'opt-in de ce visiteur.
          // Un utilisateur qui n'a jamais laissé son email sur cette page n'a
          // pas d'échéance à faire respecter : il n'a rien vu se fermer.
          const { data: lead } = await supabaseAdmin
            .from('funnel_leads')
            .select('deadline_at')
            .eq('funnel_id', funnel.id)
            .eq('email', email)
            .maybeSingle()

          if (lead?.deadline_at) echeance = new Date(lead.deadline_at)
        }


        // Une échéance ne ferme la vente que si la page le demande. Quand elle
        // ne borne qu'une remise, refuser le paiement serait absurde : le
        // prospect qui se décide au huitième jour doit pouvoir s'abonner au
        // plein tarif. C'est Stripe qui refusera alors le code expiré.
        if (
          echeance &&
          echeance.getTime() < Date.now() &&
          funnel.deadline_blocks_checkout !== false
        ) {
          console.warn('⏳ Offre expirée refusée:', { funnelSlug, planType, userId })
          return NextResponse.json(
            { error: 'Cette offre est terminée.' },
            { status: 410 }
          )
        }
      }
    }

    // 🎟️ Remise personnelle.
    //
    // Cherchée sur l'adresse du compte, et non sur le funnel d'arrivée. Quelqu'un
    // qui ferme l'onglet, revient deux jours plus tard et s'abonne depuis la page
    // des tarifs a perdu le paramètre `funnel` en route : lui refuser sa remise
    // pour cette raison serait incompréhensible de son côté.
    //
    // Le code n'est jamais accepté depuis la requête. Faire confiance au client
    // reviendrait à laisser n'importe qui réclamer le code d'un autre.
    //
    // Les tarifs Fondateur en sont exclus. Le coupon est restreint aux trois prix
    // mensuels, donc le présenter sur une offre Fondateur ne raterait pas la
    // remise : Stripe refuserait la session entière.
    if (!plan.isFounding) {
      const { data: leadPromo } = await supabaseAdmin
        .from('funnel_leads')
        .select('promo_code_id, promo_expires_at')
        .eq('email', email)
        .not('promo_code_id', 'is', null)
        .gt('promo_expires_at', new Date().toISOString())
        // Le code qui expire le plus tôt d'abord : c'est celui qu'on perdrait.
        .order('promo_expires_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (leadPromo?.promo_code_id) promotionCodeId = leadPromo.promo_code_id
    }

    // Attribution de la campagne. Le cookie a été posé sur la page d'arrivée
    // (funnel, landing ou lien email) et survit à l'inscription : c'est le
    // seul lien entre la campagne qui a produit la visite et le paiement, que
    // Stripe rattachera ensuite à l'abonnement.
    const attribution = parseAttributionCookie(cookies().get(UTM_COOKIE)?.value)
    const attributionMetadata = attributionToStripeMetadata(attribution)
    if (funnelSlug) attributionMetadata.funnel_slug = String(funnelSlug).slice(0, 100)

    console.log('🔑 Creating Stripe session with:', {
      priceId: plan.priceId,
      email,
      userId,
      isAnnual: plan.isAnnual,
      referralCode,
      referrerUserId,
      isEligibleForTrial
    })

    // Créer une session de paiement Stripe sans engagement
    const parametresSession: any = {
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ['card'],
      // Stripe interdit les deux à la fois. Quand une remise personnelle
      // s'applique, elle est posée d'office et le champ de saisie disparaît :
      // demander à quelqu'un de recopier un code qu'on connaît déjà est une
      // friction gratuite au moment le plus coûteux du parcours.
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      payment_method_collection: isEligibleForTrial ? 'always' : 'if_required',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?cancelled=true`,
      metadata: {
        userId,
        planType,
        plan: plan.plan,
        billing_interval: plan.interval,
        is_annual: plan.isAnnual ? 'true' : 'false',
        referral_code: shouldProcessReferral ? referralCode || '' : '',
        referrer_user_id: shouldProcessReferral ? referrerUserId || '' : '',
        is_trial: isEligibleForTrial ? 'true' : 'false',
        ...attributionMetadata
      },
      subscription_data: {
        ...(isEligibleForTrial ? { trial_period_days: FREE_TRIAL_DAYS } : {}),
        metadata: {
          userId,
          planType,
          plan: plan.plan,
          billing_interval: plan.interval,
          is_annual: plan.isAnnual ? 'true' : 'false',
          referral_code: shouldProcessReferral ? referralCode || '' : '',
          referrer_user_id: shouldProcessReferral ? referrerUserId || '' : '',
          is_trial: isEligibleForTrial ? 'true' : 'false',
          ...attributionMetadata
        }
      }
    }

    // Un code que Stripe refuse fait échouer la session entière, pas seulement
    // la remise. Cela arrive pour de vrai : un code déjà consommé par un premier
    // abonnement, ou supprimé depuis le tableau de bord. Laisser l'erreur
    // remonter interdirait de s'abonner à quelqu'un qui le veut et qui paie.
    // On réessaie donc une fois sans remise, et on la laisse partir plutôt que
    // la vente.
    let session
    try {
      session = await stripe.checkout.sessions.create(parametresSession)
    } catch (err: any) {
      if (!promotionCodeId) throw err
      console.warn('🎟️ Remise refusée par Stripe, reprise au plein tarif:', err?.message)
      delete parametresSession.discounts
      parametresSession.allow_promotion_codes = true
      session = await stripe.checkout.sessions.create(parametresSession)
    }

    console.log('✅ Stripe session created:', {
      sessionId: session.id,
      interval: plan.interval,
      referralApplied: !!referrerUserId,
      isEligibleForTrial
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create checkout session',
        type: error.type,
        details: error.raw?.message || error.toString()
      },
      { status: 500 }
    )
  }
}
