# 🔐 Variables d'environnement à ajouter dans Vercel

## Allez dans Vercel > Votre projet > Settings > Environment Variables

Ajoutez TOUTES ces variables (cochez Production, Preview, Development) :

```env
# ========================================
# STRIPE (Paiements)
# ========================================
# ⚠️ Récupérez vos vraies clés depuis Stripe Dashboard > Developers > API keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Prix Stripe (Récupérez les Price IDs depuis Stripe Dashboard > Products)
STRIPE_PRICE_SILVER=price_...
STRIPE_PRICE_GOLD=price_...

# ========================================
# APPLICATION
# ========================================
NEXT_PUBLIC_URL=https://www.osteo-upgrade.fr

# ========================================
# CRON JOB SECURITY
# ========================================
# Générez un secret aléatoire avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=votre_secret_aleatoire_ici

# ========================================
# EMAIL (Déjà configuré normalement)
# ========================================
RESEND_API_KEY=votre_resend_api_key
RESEND_FROM=OsteoUpgrade <no-reply@osteo-upgrade.fr>
RESEND_WEBHOOK_SECRET=votre_resend_webhook_secret

# ========================================
# SUPABASE (Déjà configuré normalement)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_supabase_service_role_key
```

## ⚠️ IMPORTANT

Après avoir ajouté toutes les variables :

1. Cliquez sur **"Save"** pour chaque variable
2. **REDÉPLOYEZ** votre application (Deployments > ... > Redeploy)

## 📋 Checklist

- [ ] STRIPE_SECRET_KEY ajouté
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ajouté
- [ ] STRIPE_WEBHOOK_SECRET ajouté
- [ ] STRIPE_PRICE_SILVER ajouté
- [ ] STRIPE_PRICE_GOLD ajouté
- [ ] NEXT_PUBLIC_URL ajouté
- [ ] Toutes les variables cochées pour Production, Preview, Development
- [ ] Application redéployée

## 🔍 Vérification

Pour vérifier que les variables sont bien chargées, vérifiez les logs Vercel :
- Vous ne devriez PAS voir d'erreur "STRIPE_SECRET_KEY is not set"
- Le build devrait réussir sans erreur
