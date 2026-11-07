# Tutoriels MyOsteoflow : état des lieux

Inventaire des fonctions de MyOsteoflow (version 1.21, relu à partir de
l’application et de tout le changelog) et des tutoriels qui les expliquent.
Objectif : qu’un praticien trouve, pour chaque fonction, une vidéo d’une
minute et ses étapes en capture.

## Comment publier un tutoriel

1. Ajouter l’entrée dans `lib/tutorials.ts` (slug, rubrique, `addedAt`,
   étapes, questions fréquentes).
2. Déposer `public/tutoriels/videos/{slug}.mp4` et son affiche `.webp`, puis
   les captures `public/tutoriels/{slug}/etape-N.webp` (une par étape).
3. Déployer le site. La page publique `/tutoriels/{slug}` et le catalogue
   `/tutoriels/catalogue.json` se mettent à jour, et MyOsteoflow (1.22 et
   suivantes) l’affiche dans sa section « Tutoriels » sans nouvelle version,
   avec le badge « Nouveau » pendant 45 jours.

Tournage : cabinet de démonstration aux données fictives uniquement. Ce qui
dépend d’un service extérieur est simulé sur un cas inventé : test de
connexion email, transcription et structuration de la dictée, hypothèses,
rédaction des courriers, bibliothèque de tests `@ec`, envoi des relances. Les
réponses de suivi J+7, les relances passées et les techniques montrées sont
des données de démonstration retirées après le tournage.

## Déjà en ligne (18)

| Rubrique | Tutoriel | Ce qu’il couvre |
|---|---|---|
| Patients et suivi | `exercices` | Programme d’exercices par l’IA, appli patient, import du bilan |
| Agenda et Doctolib | `doctolib` | Extension Chrome, synchronisation, validation des patients, agenda de la semaine |
| Interface et raccourcis | `tableau-de-bord` | Organiser les blocs, météo |
| Interface et raccourcis | `onglets-et-recherche` | Onglets patients, Ctrl + K, bouton « Nouveau » |
| Consultation | `consultation` | Feuille unique, brouillon, plein écran, raccourcis |
| Prise en main | `premiers-pas` | Complétude du profil, coordonnées et mentions, facturation, tampon, types de séance, objectifs, verrouillage |
| Prise en main | `connexion-email` | Fournisseur, mot de passe d’application, test, synchronisation |
| Prise en main | `sauvegarde` | Bouton de l’en-tête, disque externe ou clé USB, rappel quotidien, restauration |
| Consultation | `dictee-anamnese` | Dictée, structuration en cartes, drapeaux rouges, informations détectées validées au dossier |
| Consultation | `aide-diagnostic` | Hypothèses classées, questions, tests positif ou négatif, saisie sur téléphone |
| Consultation | `finaliser-consultation` | Fenêtre de fin de séance : facture, envoi, conseils post-séance, suivi à J+7, relance |
| Agenda et Doctolib | `ma-journee` | Ajouter, réordonner (flèches), créer un patient, « Vu », jours suivants, bloc « Aujourd’hui » |
| Consultation | `examen-clinique` | Techniques dans Contenu clinique, `@ec` + région avec résultat, `@tech` + région |
| Patients et suivi | `courriers` | Patient et consultation, adressage, destinataire et consigne, relecture, PDF avec tampon |
| Patients et suivi | `relances` | Bloc de l’accueil, durée, recherche, relance unitaire ou groupée, programmées, déjà relancés |
| Patients et suivi | `suivi-j7` | Questionnaire J+7, cloche, indicateurs, réponses, « Traité », en attente, emails programmés |
| Gestion du cabinet | `ma-remuneration` | Ma situation, du chiffre d’affaires à la poche, cotisations et impôt, simulateur, objectif, charges |
| Gestion du cabinet | `facturation` | Fin de séance, type et mode de paiement, envoi, dossier patient, « À traiter » |

## Manquants (8)

Les arbres décisionnels (lombalgie, cervicalgie) ne sont pas utilisés
aujourd’hui : pas de tutoriel prévu.

Priorité 1 : fonctions du quotidien ou du premier jour, sans lesquelles
l’application est mal utilisée. Priorité 2 : fonctions à forte valeur mais
moins fréquentes. Priorité 3 : compléments.

### Prise en main

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 2 | `importer-patients` | Importer ses patients | Import CSV, envoi du fichier au support, copier-coller d’une fiche Doctolib à la création d’un patient |
| 3 | `multi-cabinet` | Travailler sur plusieurs cabinets | Créer un cabinet, basculer, partage sélectif (patients, consultations, comptabilité) |
| 3 | `securite-rgpd` | Sécurité et RGPD | Verrouillage et PIN, journal d’activité, demandes RGPD des patients (accès, effacement) |

### Consultation

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Patients et suivi

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 2 | `dossier-patient` | Le dossier patient | Onglets Dossier, Consultations, Factures ; antécédents (âge ou date approximative), notes, « Recommandé par », pièces jointes, archiver et réactiver |
| 3 | `messagerie` | La messagerie | Boîte de réception, emails programmés, pièces jointes |

### Agenda et Doctolib

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Gestion du cabinet

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 2 | `recettes` | Suivre ses recettes | Recettes, filtres, ventilation par mode de paiement, corrections manuelles, récapitulatif comptable |
| 2 | `objectifs` | Fixer et suivre ses objectifs | Paramètres, Objectifs et jours travaillés ; page Objectifs ; widget Progression |
| 3 | `statistiques` | Lire ses statistiques | Motifs détectés, canaux d’acquisition, catégories « Recommandé par » |
| 3 | `export-csv` | Exporter pour son comptable | Choix des données et des colonnes, période, colonnes de santé décochées, ouverture dans Excel |

### Hors rubrique (offre OsteoUpgrade)

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 3 | `elearning` | Se former depuis MyOsteoflow | E-Learning, progression, OsteoFlash et sa répétition espacée. Réservé aux formules qui incluent OsteoUpgrade |

## Ordre de production proposé

1. **Lot 1, le premier jour** : `premiers-pas`, `connexion-email`,
   `sauvegarde`, `facturation`. **En ligne.**
2. **Lot 2, la séance** : `dictee-anamnese`, `aide-diagnostic`,
   `finaliser-consultation`, `ma-journee`. **En ligne.**
3. **Lot 3, ce qui fait la différence** : `courriers`, `ma-remuneration`,
   `examen-clinique`, `relances`, `suivi-j7`. **En ligne.**
4. **Lot 4, le reste** : tous les tutoriels de priorité 2 et 3 restants.

Le lot 1 étant en ligne, la visite guidée du premier démarrage peut
renvoyer vers `premiers-pas` plutôt que de tout expliquer elle-même.
