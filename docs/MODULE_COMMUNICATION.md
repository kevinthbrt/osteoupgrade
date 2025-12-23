# Module Communication

## Vue d'ensemble

Le module Communication permet aux administrateurs de télécharger des fichiers Word et PDF (modèles de courriers, attestations, factures, etc.) que les utilisateurs premium peuvent ensuite télécharger.

## Fonctionnalités

### Pour les Administrateurs
- Interface de gestion intégrée directement sur `/outils/communication`
- Upload de fichiers Word (.doc, .docx) et PDF
- Gestion des documents (création, modification, suppression)
- Catégorisation des documents (Courrier, Attestation, Facture, Autre)
- Activation/désactivation des documents en un clic
- Ordre d'affichage personnalisable
- Badge "Mode Administrateur" pour identifier les droits étendus
- Boutons de gestion (Activer/Désactiver, Modifier, Supprimer) sur chaque document

### Pour les Utilisateurs Premium
- Visualisation des documents actifs
- Filtrage par catégorie
- Recherche par titre ou description
- Téléchargement des fichiers
- Interface organisée par catégories

## Structure du Module

### Base de données

**Table:** `communication_documents`

```sql
- id (uuid, primary key)
- title (text, not null) - Titre du document
- description (text) - Description optionnelle
- file_url (text, not null) - URL du fichier sur Vercel Blob
- file_name (text, not null) - Nom original du fichier
- file_size (integer) - Taille du fichier en octets
- category (text) - Catégorie: courrier, attestation, facture, autre
- display_order (integer) - Ordre d'affichage
- is_active (boolean) - Document visible pour les utilisateurs
- created_by (uuid) - ID de l'administrateur créateur
- created_at (timestamp)
- updated_at (timestamp)
```

**Politiques RLS:**
- Lecture: Tous les utilisateurs peuvent lire les documents actifs
- Création/Modification/Suppression: Réservé aux administrateurs

### Fichiers Créés

1. **Migration SQL**
   - `supabase/migrations/20251223_communication_documents.sql`
   - Crée la table et les politiques RLS

2. **Types TypeScript**
   - `lib/types-communication.ts`
   - Définit les interfaces TypeScript pour le module

3. **API Route**
   - `app/api/communication-document-upload/route.ts`
   - Upload de fichiers vers Vercel Blob
   - Validation des types de fichiers (doc, docx, pdf)

4. **Page Unifiée (Utilisateurs Premium + Admin)**
   - `app/outils/communication/page.tsx`
   - **Pour tous les utilisateurs premium :**
     - Affichage des documents actifs par catégorie
     - Recherche et filtrage
     - Téléchargement
   - **Interface admin (visible uniquement pour les admins) :**
     - Bouton "Ajouter un document" dans le header
     - Badge "Mode Administrateur"
     - Boutons de gestion sur chaque document (Activer/Désactiver, Modifier, Supprimer)
     - Modal d'ajout/édition de documents
     - Affichage de tous les documents (actifs et inactifs)
     - Indicateurs visuels pour les documents inactifs

### Intégrations

1. **Hub Outils** (`app/outils/page.tsx`)
   - Ajout du module Communication
   - Carte avec gradient bleu-cyan
   - Badge "Premium"
   - Lien vers `/outils/communication`

2. **Dashboard Admin** (`app/admin/page.tsx`)
   - Lien vers la page Communication (`/outils/communication`)
   - Section dans les actions de management
   - Note : L'interface admin est intégrée directement dans la page Communication

## Restrictions d'Accès

### Rôles Autorisés (Utilisateurs)
- `premium_silver`
- `premium_gold`
- `admin`

Les utilisateurs avec le rôle `free` verront un message les invitant à passer Premium.

### Administrateurs
Seuls les utilisateurs avec le rôle `admin` peuvent :
- Uploader des fichiers
- Créer/modifier/supprimer des documents
- Activer/désactiver des documents

## Catégories Disponibles

1. **Courrier** 📧
   - Modèles de courriers professionnels
   - Lettres d'adressage

2. **Attestation** 📋
   - Attestations diverses
   - Certificats

3. **Facture** 💰
   - Modèles de facturation
   - Devis

4. **Autre** 📄
   - Autres documents utiles

## Instructions de Déploiement

### 1. Appliquer la Migration SQL

Connectez-vous à votre projet Supabase et exécutez le fichier de migration :

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement dans le SQL Editor de Supabase
# Copiez-collez le contenu de supabase/migrations/20251223_communication_documents.sql
```

### 2. Vérifier les Politiques RLS

Assurez-vous que les politiques RLS sont bien activées sur la table `communication_documents`.

### 3. Configuration Vercel Blob

Le projet utilise Vercel Blob pour stocker les fichiers. Assurez-vous que :
- Le package `@vercel/blob` est installé
- Les variables d'environnement Vercel Blob sont configurées

### 4. Tester le Module

1. **En tant qu'admin:**
   - Accédez à `/admin/communication`
   - Uploadez un fichier test
   - Vérifiez qu'il apparaît dans la liste

2. **En tant qu'utilisateur premium:**
   - Accédez à `/outils/communication`
   - Vérifiez que le document est visible
   - Testez le téléchargement

3. **En tant qu'utilisateur gratuit:**
   - Accédez à `/outils/communication`
   - Vérifiez que le message de restriction s'affiche

## Améliorations Futures Possibles

1. **Statistiques de téléchargement**
   - Tracker le nombre de téléchargements par document
   - Afficher les documents les plus populaires

2. **Versions de documents**
   - Historique des versions
   - Possibilité de revenir à une version précédente

3. **Tags personnalisés**
   - Système de tags flexible
   - Filtrage multi-tags

4. **Prévisualisation**
   - Aperçu des documents avant téléchargement
   - Viewer intégré pour les PDF

5. **Notifications**
   - Alerter les utilisateurs premium lors de l'ajout de nouveaux documents
   - Email avec les dernières mises à jour

6. **Templates dynamiques**
   - Remplissage automatique avec les données utilisateur
   - Génération de documents personnalisés

## Support

Pour toute question ou problème, consultez la documentation Supabase pour les politiques RLS et Vercel pour l'utilisation de Blob Storage.
