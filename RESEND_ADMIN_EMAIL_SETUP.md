# Configuration des Emails Admin avec Resend - OsteoUpgrade

## 📧 Objectif

Recevoir les emails admin (notifications de demandes de paiement, etc.) sur votre adresse personnelle en utilisant votre domaine **osteo-upgrade.fr** et Resend.

---

## 🔧 Prérequis

- Compte Resend créé : https://resend.com
- Accès aux DNS de votre domaine `osteo-upgrade.fr`
- Variable d'environnement `ADMIN_EMAIL` configurée

---

## 📝 Configuration étape par étape

### 1. Vérifier votre domaine dans Resend

#### a) Ajouter le domaine

1. Connectez-vous à votre dashboard Resend : https://resend.com/domains
2. Cliquez sur **"Add Domain"**
3. Entrez : `osteo-upgrade.fr`
4. Cliquez sur **"Add"**

#### b) Configurer les enregistrements DNS

Resend va vous donner **3 enregistrements DNS** à ajouter chez votre registrar (OVH, Cloudflare, etc.) :

**Exemple d'enregistrements (les valeurs seront différentes pour vous) :**

| Type | Nom | Valeur |
|------|-----|--------|
| TXT | `@` | `resend-verification=xxxxxxxxxxxxxxxxxxxxx` |
| MX | `@` | `feedback-smtp.us-east-1.amazonses.com` (Priorité: 10) |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` (Clé DKIM) |

**Comment ajouter ces enregistrements :**

**Option A - OVH :**
1. Allez dans votre espace client OVH
2. Domaine → `osteo-upgrade.fr` → Zone DNS
3. Cliquez sur **"Ajouter une entrée"**
4. Ajoutez chaque enregistrement un par un

**Option B - Cloudflare :**
1. Connectez-vous à Cloudflare
2. Sélectionnez votre domaine `osteo-upgrade.fr`
3. DNS → Records
4. Cliquez sur **"Add record"**
5. Ajoutez chaque enregistrement

**IMPORTANT :**
- Les modifications DNS peuvent prendre **jusqu'à 48h** (généralement 10-30 minutes)
- Resend vérifie automatiquement toutes les heures

#### c) Vérifier le statut

1. Retournez sur https://resend.com/domains
2. Attendez que le statut passe de **"Pending"** à **"Verified"** (icône verte ✅)

---

### 2. Configurer l'adresse email d'envoi

Une fois le domaine vérifié, vous pouvez envoyer des emails depuis **n'importe quelle adresse** de votre domaine :
- `noreply@osteo-upgrade.fr`
- `contact@osteo-upgrade.fr`
- `admin@osteo-upgrade.fr`

**Dans votre code :**

Assurez-vous que vos emails utilisent votre domaine vérifié dans le champ `from` :

```typescript
// Exemple dans vos APIs
await fetch('/api/automations/trigger', {
  method: 'POST',
  body: JSON.stringify({
    event: 'Demande de paiement parrainage',
    contact_email: process.env.ADMIN_EMAIL, // Email de destination
    metadata: {
      // ... vos données
    }
  })
})
```

Et dans votre système d'automation email (Resend/Brevo/autre), configurez :
- **From:** `noreply@osteo-upgrade.fr` (ou autre adresse de votre domaine)
- **To:** Votre email admin personnel (ex: `kevin@gmail.com`)

---

### 3. Recevoir les emails sur votre adresse personnelle

**Option 1 : Redirection d'emails (Recommandé)**

Si vous n'avez pas de boîte mail configurée sur `osteo-upgrade.fr`, vous pouvez rediriger les emails vers votre adresse personnelle.

**Avec OVH :**
1. Espace client → Email → `osteo-upgrade.fr` → Redirection
2. Créer une redirection :
   - **De :** `admin@osteo-upgrade.fr`
   - **Vers :** `votre-email-perso@gmail.com` (ou autre)

**Avec Cloudflare Email Routing (Gratuit) :**
1. Dashboard Cloudflare → Email → Email Routing
2. Cliquez sur **"Enable Email Routing"**
3. Ajoutez une règle :
   - **Catch-all** → Redirige tous les emails vers votre adresse perso
   - Ou créez une règle spécifique pour `admin@osteo-upgrade.fr`

**Option 2 : Utiliser directement votre email personnel**

Configurez simplement la variable d'environnement :

```bash
ADMIN_EMAIL=votre-email-perso@gmail.com
```

**Avantages :** Simple, immédiat
**Inconvénients :** Moins professionnel dans les en-têtes d'email

---

### 4. Configurer les variables d'environnement

Dans Vercel (ou votre environnement de production) :

```bash
# API Key Resend (trouvée dans Resend Dashboard → API Keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email admin qui recevra les notifications
ADMIN_EMAIL=admin@osteo-upgrade.fr
# OU
ADMIN_EMAIL=votre-email-perso@gmail.com

# URL de votre site (pour les liens dans les emails)
NEXT_PUBLIC_URL=https://osteoupgrade.com
```

**Sur Vercel :**
```bash
vercel env add RESEND_API_KEY
vercel env add ADMIN_EMAIL
vercel --prod
```

---

## 🧪 Tester la configuration

### Test 1 : Envoi simple avec Resend

Créez un fichier de test : `test-resend.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@osteo-upgrade.fr',
      to: process.env.ADMIN_EMAIL || 'votre-email@gmail.com',
      subject: 'Test de configuration Resend',
      html: '<p>Si vous recevez cet email, Resend est bien configuré ! 🎉</p>'
    })

    if (error) {
      console.error('❌ Erreur:', error)
    } else {
      console.log('✅ Email envoyé avec succès:', data)
    }
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

testEmail()
```

Exécutez :
```bash
npx tsx test-resend.ts
```

### Test 2 : Simuler une demande de paiement

1. Connectez-vous avec un compte Premium Gold
2. Allez sur `/settings/referrals`
3. Cliquez sur **"Demander un paiement"**
4. Uploadez un RIB (PDF ou image)
5. Vérifiez que vous recevez l'email admin

---

## ❓ Troubleshooting

### Problème : "Domain not verified"

**Solution :**
1. Vérifiez que les 3 enregistrements DNS sont bien ajoutés
2. Attendez 10-30 minutes (parfois jusqu'à 48h)
3. Vérifiez qu'il n'y a pas de doublons DNS (supprimez les anciens)
4. Utilisez un outil de vérification DNS : https://mxtoolbox.com/

### Problème : "Emails not received"

**Solutions possibles :**

1. **Vérifiez les spams** - Les premiers emails peuvent arriver en spam
2. **Vérifiez l'adresse dans ADMIN_EMAIL** - Assurez-vous qu'elle est correcte
3. **Vérifiez les logs Resend** :
   - Allez sur https://resend.com/emails
   - Vous verrez tous les emails envoyés et leur statut
4. **Vérifiez la redirection email** (si vous en utilisez une)

### Problème : "API Key Invalid"

**Solution :**
1. Créez une nouvelle API Key dans Resend Dashboard
2. Copiez-la immédiatement (elle n'est visible qu'une fois)
3. Ajoutez-la dans vos variables d'environnement
4. Redéployez votre application

### Problème : "Rate limit exceeded"

**Solution :**
- Le plan gratuit Resend permet **100 emails/jour**
- Si vous dépassez, passez au plan payant ou attendez 24h
- Évitez les boucles d'envoi d'emails dans votre code

---

## 📊 Monitoring

### Vérifier les emails envoyés

1. Dashboard Resend : https://resend.com/emails
2. Vous verrez :
   - ✅ **Delivered** : Email bien reçu
   - ⏳ **Queued** : En cours d'envoi
   - ❌ **Bounced** : Adresse invalide ou rejetée
   - 📭 **Complained** : Marqué comme spam

### Logs dans Vercel

Pour debug les erreurs d'envoi :
1. Vercel Dashboard → Votre projet → Logs
2. Recherchez : `api/automations/trigger`
3. Vous verrez les erreurs Resend s'il y en a

---

## 🎯 Récapitulatif

### Ce que vous devez faire :

1. ✅ **Vérifier votre domaine `osteo-upgrade.fr` dans Resend**
   - Ajouter les 3 enregistrements DNS
   - Attendre la vérification (10-30 min)

2. ✅ **Configurer la réception des emails**
   - Option A : Redirection `admin@osteo-upgrade.fr` → votre email perso
   - Option B : Utiliser directement votre email perso dans `ADMIN_EMAIL`

3. ✅ **Configurer les variables d'environnement**
   ```bash
   RESEND_API_KEY=re_xxxxx
   ADMIN_EMAIL=admin@osteo-upgrade.fr  # Ou votre email perso
   NEXT_PUBLIC_URL=https://osteoupgrade.com
   ```

4. ✅ **Tester l'envoi d'email**
   - Créer une demande de paiement de test
   - Vérifier la réception dans votre boîte mail

---

## 📞 Support

**Documentation Resend :**
- Guide de vérification de domaine : https://resend.com/docs/dashboard/domains/introduction
- Configuration DNS : https://resend.com/docs/dashboard/domains/dns-records
- API Reference : https://resend.com/docs/api-reference/emails/send-email

**En cas de problème :**
1. Vérifiez les logs Resend Dashboard
2. Vérifiez les logs Vercel Functions
3. Testez avec l'outil de test ci-dessus
4. Contactez le support Resend si nécessaire

---

**Version :** 1.0
**Dernière mise à jour :** Janvier 2026
**Auteur :** Claude Code
