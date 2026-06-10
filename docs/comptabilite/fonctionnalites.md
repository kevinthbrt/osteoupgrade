# Présentation des fonctionnalités — OsteoUpgrade & MyOsteoflow

**Document préparé pour la comptabilité** · Juin 2026

Le projet commercialise, en un seul abonnement (35 €/mois ou 299 €/an), deux outils complémentaires destinés aux ostéopathes, étiopathes et chiropracteurs francophones :

1. **OsteoUpgrade** — un site web de formation continue (www.osteo-upgrade.fr)
2. **MyOsteoflow** — un logiciel de gestion de cabinet à installer sur ordinateur (Windows/macOS)

Seules les fonctionnalités effectivement accessibles dans l'interface actuelle sont décrites ici.

---

## 1. OsteoUpgrade — la plateforme de formation en ligne

Accessible depuis n'importe quel navigateur après création d'un compte. Une offre gratuite donne accès à un module d'essai (l'épaule) ; l'abonnement Premium débloque tout.

### Tableau de bord personnalisé
Page d'accueil de l'abonné : progression dans les formations, niveau et points d'expérience, badges obtenus, série de connexions, activité de la semaine et accès rapide à tous les modules. Cette « gamification » encourage l'utilisation régulière (donc la fidélisation des abonnés).

### Cours (e-learning)
Formations vidéo structurées en chapitres et sous-parties (5 formations, ~60 chapitres actuellement). Après chaque vidéo, un quiz valide les acquis : il faut réussir le quiz pour débloquer la vidéo suivante. Un certificat peut être délivré en fin de parcours.

### Pratique (vidéothèque de techniques)
Plus de 240 vidéos de démonstration de techniques ostéopathiques (manipulations, mobilisations, tissus mous…), classées par région anatomique (cervicales, lombaires, épaule, genou…) et par catégorie de technique.

### Revue OsteoUpgrade (veille scientifique)
Synthèses mensuelles d'études scientifiques en ostéopathie et thérapie manuelle, rédigées et commentées : citation de l'étude, résultats clés, application au cabinet. Filtrables par thème.

### Tests orthopédiques
Référentiel de plus de 115 tests cliniques organisés par zone anatomique, avec pour chacun : vidéo de démonstration, valeurs scientifiques (sensibilité/spécificité), indication et interprétation. Inclut des « clusters » (combinaisons de tests recommandées pour un diagnostic).

### OsteoFlash (flashcards)
Cartes de révision à « répétition espacée » (la plateforme représente les cartes au bon moment pour ancrer la mémorisation) — plus de 350 cartes réparties en paquets thématiques, avec suivi de progression et certificat.

### Topographie (atlas anatomique)
Vues anatomiques par région permettant de réviser les repères de palpation et les structures (os, ligaments, muscles, nerfs).

### Parrainage & cagnotte
Chaque abonné annuel dispose d'un code de parrainage personnel. Pour chaque filleul qui souscrit un abonnement annuel, le parrain gagne 10 % (29,90 €) dans une cagnotte, virée par virement bancaire à partir de 50 €. C'est le principal levier d'acquisition de clients.

### Compte et abonnement
Gestion du profil, du mot de passe, des notifications, et de l'abonnement : souscription par carte bancaire (Stripe), choix mensuel/annuel, factures et moyens de paiement en libre-service, résiliation.

### Partie administration (réservée au gérant)
Interface d'administration interne : gestion des utilisateurs et abonnements, création de codes promo, validation des virements de parrainage, édition de tout le contenu pédagogique (cours, tests, vidéos, articles), campagnes d'emails aux abonnés et traitement des tickets de support.

---

## 2. MyOsteoflow — le logiciel de gestion de cabinet

Application à installer sur l'ordinateur du praticien. Particularité importante : **toutes les données patients restent stockées localement sur la machine du praticien** (conformité RGPD), rien n'est envoyé sur un serveur central. L'accès au logiciel est lié à l'abonnement OsteoUpgrade (vérification de licence en ligne, avec tolérance de 7 jours hors connexion).

### Gestion des patients
Fiches patients complètes : coordonnées, antécédents médicaux, chirurgicaux et traumatiques, profession, activités sportives. Recherche instantanée, archivage, import en masse (fichier CSV ou copier-coller depuis Doctolib).

### Consultations
Dossier de consultation structuré : anamnèse (interrogatoire), examen clinique, tests orthopédiques pratiqués, schéma corporel interactif pour localiser les douleurs, conseils donnés au patient. Historique chronologique par patient, brouillons, arbres décisionnels d'aide au diagnostic (cervicalgies, lombalgies).

### Intelligence artificielle intégrée
- **Dictée vocale** : le praticien dicte son anamnèse au micro, le texte est transcrit automatiquement en français
- **Structuration automatique** : l'IA range la dictée dans les bonnes rubriques du dossier et signale les « drapeaux rouges » (signes d'alerte médicaux)
- **Suggestions de tests** orthopédiques pertinents selon le motif de consultation
- **Prescription d'exercices** : génération de programmes d'exercices personnalisés, conformes aux protocoles scientifiques, exportables en PDF ou envoyés par email au patient
- **Courriers professionnels** : rédaction assistée de lettres aux médecins (comptes rendus, adressages)

### Facturation et encaissements
Création de factures depuis la consultation, génération de PDF professionnels personnalisables (couleurs, en-tête du cabinet), envoi par email, suivi des statuts (brouillon → émise → payée), encaissements multi-moyens (espèces, carte, virement, chèque…) et paiements fractionnés.

### Comptabilité et statistiques
Tableau de bord financier : chiffre d'affaires du mois, panier moyen, répartition par moyen de paiement, comparaison aux objectifs mensuels fixés, graphiques d'évolution, exports CSV/Excel pour le comptable, envoi de rapports par email.

### Emails et suivi des patients
Connexion de la boîte email du praticien (toute messagerie) pour envoyer et recevoir directement dans le logiciel. Modèles d'emails personnalisables. **Email de suivi automatique à J+7** après chaque consultation, avec questionnaire de satisfaction (douleur, mobilité, satisfaction) dont les réponses reviennent dans le dossier patient. Messages groupés à la patientèle.

### Formation continue intégrée
Accès depuis le logiciel aux contenus OsteoUpgrade : cours, vidéos et flashcards, sans quitter son outil de travail.

### Sécurité et conformité
Verrouillage par code PIN, chiffrement des identifiants email, journal d'audit des modifications, sauvegarde de la base, export et suppression des données patients (droits RGPD).

### Distribution et mises à jour
Installateurs Windows (.exe) et macOS (.dmg), mises à jour automatiques téléchargées en arrière-plan, tickets de support intégrés à l'application.

---

## 3. Comment les deux produits s'articulent

```
        Client (ostéopathe)
              │  35 €/mois ou 299 €/an (Stripe)
              ▼
   ┌─────────────────────────┐
   │  Abonnement Premium      │
   └────────────┬────────────┘
        ┌───────┴────────┐
        ▼                ▼
  OsteoUpgrade      MyOsteoflow
  (formation,       (gestion de cabinet,
   site web)         appli de bureau)
        ▲                │
        └── vérification │ de licence,
            contenus et  │ services IA
            questionnaires patients
```

- L'abonnement est **unique** : un seul paiement donne accès aux deux outils.
- Le site OsteoUpgrade sert aussi de « serveur » à MyOsteoflow : vérification des licences, fourniture des contenus de formation et accès aux services d'IA.
- Le positionnement commercial : remplacer ~750 €/an d'outils séparés (logiciel de cabinet + formations) par une offre intégrée à 299 €/an.
