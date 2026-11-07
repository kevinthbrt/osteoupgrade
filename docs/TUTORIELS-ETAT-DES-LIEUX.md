# Tutoriels MyOsteoflow : état des lieux

Inventaire des fonctions de MyOsteoflow (version 1.21, relu à partir de
l'application et de tout le changelog) et des tutoriels qui les expliquent.
Objectif : qu'un praticien trouve, pour chaque fonction, une vidéo d'une
minute et ses étapes en capture.

## Comment publier un tutoriel

1. Ajouter l'entrée dans `lib/tutorials.ts` (slug, rubrique, `addedAt`,
   étapes, questions fréquentes).
2. Déposer `public/tutoriels/videos/{slug}.mp4` et son affiche `.webp`, puis
   les captures `public/tutoriels/{slug}/etape-N.webp` (une par étape).
3. Déployer le site. La page publique `/tutoriels/{slug}` et le catalogue
   `/tutoriels/catalogue.json` se mettent à jour, et MyOsteoflow (1.22 et
   suivantes) l'affiche dans sa section « Tutoriels » sans nouvelle version,
   avec le badge « Nouveau » pendant 45 jours.

Tournage : cabinet de démonstration aux données fictives uniquement, comme
pour les cinq premiers.

## Déjà en ligne (5)

| Rubrique | Tutoriel | Ce qu'il couvre |
|---|---|---|
| Patients et suivi | `exercices` | Programme d'exercices par l'IA, appli patient, import du bilan |
| Agenda et Doctolib | `doctolib` | Extension Chrome, synchronisation, validation des patients, agenda de la semaine |
| Interface et raccourcis | `tableau-de-bord` | Organiser les blocs, météo |
| Interface et raccourcis | `onglets-et-recherche` | Onglets patients, Ctrl + K, bouton « Nouveau » |
| Consultation | `consultation` | Feuille unique, brouillon, plein écran, raccourcis |

## Manquants (22)

Priorité 1 : fonctions du quotidien ou du premier jour, sans lesquelles
l'application est mal utilisée. Priorité 2 : fonctions à forte valeur mais
moins fréquentes. Priorité 3 : compléments.

### Prise en main

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 1 | `premiers-pas` | Configurer son cabinet en 5 minutes | Code PIN, Paramètres, Coordonnées (profession, RPPS ou RPE/RNE, statut, TVA), tampon et logo, types de séance et tarifs, widget « Complétez votre profil » |
| 1 | `connexion-email` | Connecter sa boîte email | Paramètres, Connexion e-mail : adresse dédiée, mot de passe d'application Gmail, test d'envoi. Prérequis des factures par email, suivis, relances et exercices |
| 1 | `sauvegarde` | Sauvegarder et restaurer ses données | Les données restent sur l'ordinateur : bouton de sauvegarde de l'en-tête, rappel quotidien, restauration sur un nouveau poste |
| 2 | `importer-patients` | Importer ses patients | Import CSV, envoi du fichier au support, copier-coller d'une fiche Doctolib à la création d'un patient |
| 3 | `multi-cabinet` | Travailler sur plusieurs cabinets | Créer un cabinet, basculer, partage sélectif (patients, consultations, comptabilité) |
| 3 | `securite-rgpd` | Sécurité et RGPD | Verrouillage et PIN, journal d'activité, demandes RGPD des patients (accès, effacement) |

### Consultation

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 1 | `dictee-anamnese` | Dicter l'anamnèse | Enregistrement, structuration en cartes, antécédents et champs patient détectés (accepter ou ignorer), effacer et recommencer |
| 1 | `aide-diagnostic` | Hypothèses cliniques et drapeaux rouges | Hypothèses, questions complémentaires et tests suggérés après la dictée, code couleur des drapeaux |
| 1 | `finaliser-consultation` | Terminer la séance | Assistant de fin : facture et mode d'envoi, conseils post-séance cochés pour ce patient, suivi à J+x, relance à 3, 6 ou 12 mois |
| 2 | `examen-clinique` | Examen clinique : tests et techniques | `@ec` + région, `@tech` et sa bibliothèque (Paramètres, Contenu clinique), « Tests orthos » et clusters, Topographie |
| 3 | `arbres-decisionnels` | Arbres décisionnels lombalgie et cervicalgie | Parcours interactif, tests, conseils insérés dans la consultation |

### Patients et suivi

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 1 | `courriers` | Rédiger un courrier en quelques secondes | Courriers : patient et consultation, modèle (compte-rendu, médecin traitant), relecture, PDF avec tampon, envoi |
| 2 | `dossier-patient` | Le dossier patient | Onglets Dossier, Consultations, Factures ; antécédents (âge ou date approximative), notes, « Recommandé par », pièces jointes, archiver et réactiver |
| 2 | `suivi-j7` | Suivi J+7 et questionnaires | Envoi automatique, délai par consultation, réponses dans Suivi patients, cloche, « Envoyer un mail » |
| 2 | `relances` | Relancer les patients et écrire à tous | Patients inactifs, lien de prise de rendez-vous, relances programmées, diffusion à tous (compteur, limite de 450 par jour) |
| 3 | `messagerie` | La messagerie | Boîte de réception, emails programmés, pièces jointes |

### Agenda et Doctolib

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 1 | `ma-journee` | Préparer sa journée | Ordre de passage, glisser pour réorganiser, vu ou à revoir, création rapide d'un patient, sans Doctolib (le tutoriel `doctolib` ne couvre que la synchronisation) |

### Gestion du cabinet

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 1 | `facturation` | Facturer et encaisser | Type de séance, montant, mode de paiement ; ouvrir une facture, changer son statut, PDF, réimpression ; spécificités Québec (TPS/TVQ) en une étape |
| 1 | `ma-remuneration` | Savoir combien vous verser | Comptabilité, Charges (quote-part pro, barème kilométrique), immobilisations, Ma rémunération, simulateur « Et si mon activité changeait ? » |
| 2 | `recettes` | Suivre ses recettes | Recettes, filtres, ventilation par mode de paiement, corrections manuelles, récapitulatif comptable |
| 2 | `objectifs` | Fixer et suivre ses objectifs | Paramètres, Objectifs et jours travaillés ; page Objectifs ; widget Progression |
| 3 | `statistiques` | Lire ses statistiques | Motifs détectés, canaux d'acquisition, catégories « Recommandé par » |
| 3 | `export-csv` | Exporter pour son comptable | Choix des données et des colonnes, période, colonnes de santé décochées, ouverture dans Excel |

### Hors rubrique (offre OsteoUpgrade)

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 3 | `elearning` | Se former depuis MyOsteoflow | E-Learning, progression, OsteoFlash et sa répétition espacée. Réservé aux formules qui incluent OsteoUpgrade |

## Ordre de production proposé

1. **Lot 1, le premier jour** : `premiers-pas`, `connexion-email`,
   `sauvegarde`, `facturation`.
2. **Lot 2, la séance** : `dictee-anamnese`, `aide-diagnostic`,
   `finaliser-consultation`, `ma-journee`.
3. **Lot 3, ce qui fait la différence** : `courriers`, `ma-remuneration`,
   `examen-clinique`, `relances`, `suivi-j7`.
4. **Lot 4, le reste** : tous les tutoriels de priorité 2 et 3 restants.

Une fois le lot 1 en ligne, la visite guidée du premier démarrage peut
renvoyer vers `premiers-pas` plutôt que de tout expliquer elle-même.
