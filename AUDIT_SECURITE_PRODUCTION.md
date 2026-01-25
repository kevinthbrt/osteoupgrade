# AUDIT COMPLET - OsteoUpgrade

**Date:** 25 janvier 2026
**Auditeur:** Claude (Audit automatisé)
**Version:** 1.0

---

## 1. RESUME EXECUTIF

**Niveau de risque global : CRITIQUE**

### Top 10 Problemes Prioritaires (P0/P1)

| # | Probleme | Severite |
|---|----------|----------|
| 1 | **7 routes d'upload de fichiers sans authentification** | CRITIQUE |
| 2 | **API `/api/mailing/send` permet l'envoi d'emails de masse sans auth** | CRITIQUE |
| 3 | **API `/api/automations/trigger` accessible publiquement** | CRITIQUE |
| 4 | **Vulnerabilite IDOR sur `/api/quiz/attempts`** - accepte user_id arbitraire | CRITIQUE |
| 5 | **RLS `user_gamification_stats` avec `true` pour ALL** | CRITIQUE |
| 6 | **XSS potentiel** - sanitisation HTML insuffisante (uniquement `<script>`) | ELEVE |
| 7 | **Aucun header de securite** (CSP, HSTS, X-Frame-Options) | ELEVE |
| 8 | **Aucun rate limiting** sur les endpoints sensibles | ELEVE |
| 9 | **Politique de confidentialite manquante** (page referencee inexistante) | ELEVE |
| 10 | **Banniere de consentement cookies absente** | ELEVE |

### Verdict : **NO-GO**

L'application presente des failles de securite critiques qui permettent a un attaquant de :
- Uploader des fichiers arbitraires (potentiellement malveillants)
- Envoyer des emails de masse a tous les utilisateurs
- Manipuler les statistiques de gamification de n'importe quel utilisateur
- Creer des tentatives de quiz pour n'importe quel utilisateur
- Declencher des automatisations sans autorisation

**Ces failles doivent etre corrigees AVANT toute mise en production.**

---

## 2. TABLEAU DETAILLE DES FINDINGS

### A) Securite & Autorisation

| Categorie | Severite | Preuve | Impact | Correctif | Priorite | Effort |
|-----------|----------|--------|--------|-----------|----------|--------|
| **API sans auth** | CRITIQUE | `app/api/course-image-upload/route.ts` | Upload de fichiers arbitraires vers Vercel Blob | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/pathology-image-upload/route.ts` | Upload de fichiers arbitraires | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/seminar-image-upload/route.ts` | Upload de fichiers arbitraires | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/exercise-illustration-upload/route.ts` | Upload de fichiers arbitraires | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/literature-review-image-upload/route.ts` | Upload de fichiers arbitraires | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/topographic-view-upload/route.ts` | Upload de fichiers arbitraires | Ajouter verification auth + role admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/automations/trigger/route.ts` | Declenchement d'automations arbitraires | Ajouter verification auth admin ou secret CRON | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/mailing/send/route.ts` | Envoi d'emails de masse a tous les users | Ajouter verification auth admin | P0 | S |
| **API sans auth** | CRITIQUE | `app/api/automations/daily-checks/route.ts` | Declenchement de jobs sans protection | Ajouter header `CRON_SECRET` comme check-renewals | P0 | S |
| **IDOR** | CRITIQUE | `app/api/quiz/attempts/route.ts:41-43` | Creation de quiz attempts pour tout user_id | Utiliser `auth.getUser()` au lieu d'accepter user_id | P0 | S |
| **RLS permissive** | CRITIQUE | `user_gamification_stats` policy `ALL` = `true` | Modification des stats de n'importe quel user | Changer policy pour `auth.uid() = user_id` | P0 | S |
| **RLS permissive** | CRITIQUE | `user_achievements` INSERT = `true` | Creation d'achievements pour tout user | Restreindre a `auth.uid() = user_id` ou service role | P0 | S |
| **Stripe checkout** | ELEVE | `app/api/stripe/checkout/route.ts:6` | userId accepte du body sans validation | Valider que userId = user authentifie | P1 | S |
| **XSS** | ELEVE | `app/topographie/page.tsx:99` | Sanitisation faible (regex `<script>` uniquement) | Utiliser DOMPurify | P1 | M |
| **XSS** | ELEVE | Multiple uses of `dangerouslySetInnerHTML` | Injection HTML possible | Sanitiser tout HTML avec DOMPurify | P1 | M |
| **Headers securite** | ELEVE | `next.config.js` | Aucun header de securite configure | Ajouter CSP, HSTS, X-Frame-Options, etc. | P1 | S |
| **Rate limiting** | ELEVE | Aucun fichier | Brute force / DoS possible | Implementer rate limiting (Vercel Edge, upstash) | P1 | M |
| **Client auth inconsistent** | MOYEN | `app/api/admin/referral-payouts/route.ts:2` | Utilise `supabase` client au lieu de `supabaseAdmin` pour auth check | Utiliser `createRouteHandlerClient` | P2 | S |

### B) Conformite Legale FR/UE (RGPD)

| Categorie | Severite | Preuve | Impact | Correctif | Priorite | Effort |
|-----------|----------|--------|--------|-----------|----------|--------|
| **Politique confidentialite** | CRITIQUE | Aucune page `/politique-confidentialite` | Non-conformite RGPD | Creer page avec contenu RGPD complet | P0 | M |
| **Consentement cookies** | ELEVE | Aucune banniere cookie | Non-conformite ePrivacy | Implementer banniere cookie (ex: tarteaucitron) | P1 | M |
| **CGU incompletes** | ELEVE | `app/cgu/page.tsx` | Placeholders `[votre-domaine]`, `[adresse]`, etc. | Remplir toutes les informations legales | P1 | S |
| **Mentions legales** | ELEVE | Manquantes | Obligation legale non respectee | Creer page mentions legales | P1 | S |
| **Donnees de sante** | ELEVE | Tables `consultation_sessions_*`, `pathologies` | Traitement de donnees sensibles (sante) | Ajouter mentions specifiques dans politique | P1 | M |
| **Droit d'acces/suppression** | MOYEN | Aucune implementation visible | Droits RGPD non implementes | Ajouter endpoints et process de gestion | P2 | L |
| **Sous-traitants** | MOYEN | Non documente | Liste des sous-traitants manquante | Documenter: Vercel, Supabase, Stripe, Resend | P2 | S |

### C) SEO / Accessibilite / Production

| Categorie | Severite | Preuve | Impact | Correctif | Priorite | Effort |
|-----------|----------|--------|--------|-----------|----------|--------|
| **sitemap.xml** | MOYEN | Absent | SEO degrade | Creer `app/sitemap.ts` | P2 | S |
| **robots.txt** | MOYEN | Absent | SEO degrade | Creer `public/robots.txt` | P2 | S |
| **Monitoring** | MOYEN | Aucun setup visible | Pas de visibilite sur erreurs prod | Ajouter Sentry ou equivalent | P2 | M |

---

## 3. DETAIL DES FAILLES CRITIQUES (P0)

### FAILLE #1 : Routes d'upload sans authentification

**Fichiers concernes :**
- `app/api/course-image-upload/route.ts`
- `app/api/pathology-image-upload/route.ts`
- `app/api/seminar-image-upload/route.ts`
- `app/api/exercise-illustration-upload/route.ts`
- `app/api/literature-review-image-upload/route.ts`
- `app/api/topographic-view-upload/route.ts`

**Exploitation :**
```bash
curl -X POST https://votre-domaine.com/api/course-image-upload \
  -F "file=@malicious.html"
```

**Correctif immediat :**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
  }

  // ... reste du code
}
```

### FAILLE #2 : API mailing sans authentification

**Fichier :** `app/api/mailing/send/route.ts`

**Exploitation :**
```bash
curl -X POST https://votre-domaine.com/api/mailing/send \
  -H "Content-Type: application/json" \
  -d '{"audienceMode":"all","subject":"Spam","html":"<p>Malicious content</p>"}'
```

**Impact :** Envoi de spam/phishing a TOUS les utilisateurs de la plateforme.

### FAILLE #3 : IDOR sur quiz attempts

**Fichier :** `app/api/quiz/attempts/route.ts:41-43`

**Code vulnerable :**
```typescript
const { quiz_id, user_id, score, ... } = body
// user_id accepte directement du body sans validation !
```

**Correctif :**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { quiz_id, score, ... } = body
// Utiliser user.id au lieu du body
```

### FAILLE #4 : RLS `user_gamification_stats`

**Policy actuelle :**
```sql
CREATE POLICY "System can manage stats" ON user_gamification_stats
FOR ALL USING (true);
```

**Correctif SQL :**
```sql
DROP POLICY "System can manage stats" ON user_gamification_stats;

CREATE POLICY "Users manage own stats" ON user_gamification_stats
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role bypass" ON user_gamification_stats
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 4. CHECKLIST GO-LIVE

### Obligatoire avant production :

- [ ] Securiser les 7 routes d'upload avec auth admin
- [ ] Securiser `/api/mailing/send` avec auth admin
- [ ] Securiser `/api/automations/trigger` avec auth/CRON_SECRET
- [ ] Securiser `/api/automations/daily-checks` avec CRON_SECRET
- [ ] Corriger IDOR sur `/api/quiz/attempts`
- [ ] Corriger RLS `user_gamification_stats`
- [ ] Corriger RLS `user_achievements`
- [ ] Creer page politique de confidentialite
- [ ] Implementer banniere cookies
- [ ] Completer les CGU (remplacer placeholders)
- [ ] Ajouter headers de securite dans `next.config.js`

### Recommande :

- [ ] Implementer DOMPurify pour sanitisation HTML
- [ ] Ajouter rate limiting (upstash/redis)
- [ ] Configurer Sentry pour monitoring
- [ ] Creer sitemap.xml et robots.txt
- [ ] Valider Stripe checkout (userId = user authentifie)

---

## 5. ANNEXES

### A) Requetes SQL de test RLS

```sql
-- Test 1: Verifier si un user peut modifier les stats d'un autre
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = 'attacker-uuid';

UPDATE user_gamification_stats
SET total_xp = 999999
WHERE user_id = 'victim-uuid';
-- Devrait echouer mais REUSSIT actuellement

-- Test 2: Creer un achievement pour un autre user
INSERT INTO user_achievements (user_id, achievement_id)
VALUES ('victim-uuid', 'achievement-uuid');
-- Devrait echouer mais REUSSIT actuellement
```

### B) Configuration headers securite recommandee

```javascript
// next.config.js
const nextConfig = {
  // ... config existante
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://*.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ]
  },
}
```

### C) Outils recommandes

| Outil | Usage | Cout |
|-------|-------|------|
| **Sentry** | Error tracking & monitoring | Freemium |
| **Upstash** | Rate limiting Redis serverless | Freemium |
| **DOMPurify** | Sanitisation HTML XSS-safe | Gratuit |
| **tarteaucitron.js** | Banniere cookies RGPD | Gratuit |
| **next-sitemap** | Generation sitemap automatique | Gratuit |

---

## 6. CONCLUSION

Cette application presente **des failles de securite critiques** qui exposent :
- Les donnees de tous les utilisateurs
- La possibilite d'usurpation d'identite
- L'envoi de communications frauduleuses
- Le stockage de fichiers malveillants

**Action immediate requise** : Bloquer le deploiement en production jusqu'a correction des failles P0.

**Estimation effort total P0** : ~1-2 jours de developpement
**Estimation effort total P1** : ~3-5 jours de developpement
