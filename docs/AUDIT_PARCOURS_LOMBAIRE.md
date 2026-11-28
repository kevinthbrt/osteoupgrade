# Audit du parcours lombaire

Relecture complète du parcours `lombaire` (statut `draft`), faite le
28 novembre 2026 à partir de la base de production : 34 chapitres, 9 parties,
181 sections, 137 références, 21 techniques, 19 activités.

Critère de lecture, fixé avec l’équipe : à la fin du parcours, un thérapeute
manuel doit **tout savoir** de la lombalgie, **reconnaître** chaque tableau
(sans poser de diagnostic médical, mais en raisonnant comme s’il devait le
faire) et **adapter son traitement** en conséquence.

## Verdict

**Ne pas refaire le parcours.** Le fond est solide, rigoureux et cohérent :
l’axe en quatre décisions (relève de moi, mécanisme, profil, risque) est une
vraie force, les chapitres sur les pièges et les biais sont rares dans une
formation de ce type, et le discours sur les preuves est honnête.

Il faut en revanche :

1. **corriger** une dizaine de points précis, dont trois incohérences avec
   l’axe du parcours lui-même (section A) ;
2. **mettre à jour** la littérature sur six sujets où des essais importants
   manquent (section B) ;
3. **compléter** ce qui manque pour l’objectif « reconnaître et adapter le
   traitement » : surtout la partie « que faire » de plusieurs tableaux, un
   chapitre sur les traitements médicaux, et quelques tableaux et populations
   (section C) ;
4. **rendre le parcours plus actif** : 15 chapitres sur 34 n’ont aucune
   activité (section D).

Ces chantiers se font chapitre par chapitre, en même temps que la mise en
scène décrite dans `docs/PARCOURS_ANIMES.md`.

**Limite de cet audit.** Les références ont été vérifiées de mémoire, sur la
littérature connue jusqu’à mi-2026. La mise à jour NICE du 29 juillet 2026,
citée par le parcours, n’a pas pu être revérifiée ici. Conformément à la règle
de `docs/PARCOURS_REGIONAUX.md`, chaque correction de la section B doit être
contrôlée à sa source avant d’entrer dans une migration.

## A. Corrections (erreurs et incohérences)

**État : appliqué le 28 novembre 2026** par
`supabase/migrations/20261128_lombaire_16_corrections_audit.sql`, après essai
dans une transaction annulée. Seul A10 (les DOI) reste à faire. Les chiffres
de A5 et la référence de A6 ont été vérifiés à la source avant correction :
Itz 2013 rapporte 65 % de patients encore douloureux à un an, da Silva 2019
69 % de récidives dans l’année, et l’étude retenue pour A6 est O’Keeffe et
al., Eur J Pain 2022.

| # | Chapitre | Problème | Correction proposée |
|---|---|---|---|
| A1 | `classification`, section « Les limites du modèle » | Annonce que le parcours superpose ensuite « le sous-classement clinique par tableau (discogénique, facettaire, instabilité, ceinture pelvienne), utile pour choisir une première intention ». C’est l’ancienne architecture, abandonnée au profit des quatre décisions. | Réécrire pour annoncer les axes mécanisme, profil et risque, et présenter le répertoire des tableaux comme un complément. |
| A2 | `cas-cliniques`, cas 1 | « Catégorie 3, lombalgie non spécifique, probablement discogénique » : nomme un tissu, ce que trois chapitres démontrent impossible. | Supprimer « probablement discogénique » et raisonner en mécanisme et préférence directionnelle. |
| A3 | `cas-cliniques`, les six cas | Les cas n’utilisent pas la grille en quatre lignes enseignée par `croiser-les-axes`. La partie « Intégrer » n’intègre donc pas l’outil central du parcours. | Conclure chaque cas par les quatre lignes (relève de moi, mécanisme, profil, risque). |
| A4 | `voisinage` et cas 5 | Le syndrome de la charnière thoraco-lombaire est présenté comme établi (« trois signes cliniques le confirment »). Sa validation est faible : concept essentiellement issu d’une école, palper-rouler et cellulalgie peu étudiés en fiabilité. Le parcours applique pourtant au psoas exactement l’exigence inverse. | Même traitement que le psoas : ce qui est décrit, ce qui n’est pas validé, et l’usage défendable (hypothèse testée par un traitement d’épreuve et un signe comparable). Adapter le cas 5. |
| A5 | `epidemiologie`, « Ce que devient un épisode » | « Environ un tiers gardent une douleur résiduelle à un an, la moitié récidive dans l’année. » La revue citée (Itz 2013) rapporte plutôt qu’une majorité, de l’ordre des deux tiers, déclare encore une douleur à 12 mois. Les taux de récidive varient fortement selon la définition retenue (de 24 à 80 % selon Stanton 2008). | Revérifier les chiffres dans Itz 2013 et reformuler. Donner une fourchette avec sa raison plutôt qu’un chiffre unique. |
| A6 | `discogenique`, bibliographie | Référence « Barsky Reese J, Nicholls E, Hill JC et al. … Eur J Pain et travaux apparentés (2021) » : citation non identifiable, probablement composite. | La remplacer par des travaux vérifiables sur l’effet des étiquettes diagnostiques, par exemple O’Keeffe et al., Eur J Pain 2022 (à vérifier). |
| A7 | `radiculopathie`, « Situer le niveau » | « Une cruralgie isolée impose de penser au diabète, au psoas… » : « le psoas » sans précision contredit le chapitre `voisinage`, qui retire le psoas comme diagnostic lombaire. | Écrire « hématome ou abcès du psoas, causes rétropéritonéales ». |
| A8 | `radiculopathie`, « Faire converger les trois plans » | « Deux plans sur trois rendent le diagnostic probable » : règle pédagogique présentée comme un critère. | Préciser que c’est une règle de raisonnement, pas un cluster validé. |
| A9 | `classification`, `principes-traitement`, `reorientation` | La NG59 est datée de 2020 dans ces bibliographies, alors que le parcours enseigne la mise à jour de juillet 2026. | Harmoniser la référence NICE partout. |
| A10 | Toutes | 117 références sur 137 n’ont pas d’URL ni de DOI. | Ajouter les DOI. Utile aussi pour la relecture future. |
| A11 | `discogenique`, « Les mots employés devant le patient » | La phrase proposée au patient commençait par « votre disque est sensibilisé », alors que la section précédente démontre qu’on ne peut pas désigner le disque. Repéré pendant la correction. | « Votre dos est sensibilisé… ». La phrase ne désigne plus aucun tissu. |

## B. Mises à jour de la littérature

À vérifier à la source avant intégration.

| Sujet | Ce qui manque | Chapitres concernés |
|---|---|---|
| Thérapie fonctionnelle cognitive | Essai RESTORE (Kent et al., Lancet 2023) : la CFT, délivrée par des kinésithérapeutes, fait nettement mieux que les soins usuels sur l’incapacité à un an dans la lombalgie chronique. Le parcours cite O’Sullivan 2018 mais pas cet essai. C’est d’autant plus important que le retrait des recommandations NICE 1.2.13 et 1.2.14 laisse un vide sur la prise en charge du patient à risque élevé. | `education-matching`, `exercice-mckenzie`, `principes-traitement`, `drapeaux-jaunes` |
| Stratification du risque | Les essais STarT MSK (Hill et al., Lancet Rheumatol 2022) et TARGET (Delitto et al., PLoS Med 2021) n’ont pas reproduit le bénéfice de l’essai STarT Back de 2011. Le chapitre présente la stratification sans cette nuance. | `drapeaux-jaunes`, `croiser-les-axes` |
| Médicaments | Essai OPAL (Jones et al., Lancet 2023) : opioïdes pas meilleurs que le placebo dans la lombalgie aiguë, avec plus d’effets indésirables. Essai PRECISE (Mathieson et al., NEJM 2017) : prégabaline inefficace dans la sciatique. Essai PACE (Williams et al., Lancet 2014) sur le paracétamol : cité dans le texte mais absent de la bibliographie. | Nouveau chapitre (voir C2), `principes-traitement` |
| Chirurgie de la sciatique | Bailey et al., NEJM 2020 : dans la sciatique persistante de 4 à 12 mois, la microdiscectomie fait mieux que le conservateur à 6 mois. Le chapitre s’appuie sur Peul 2007 (résultats comparables à un an) sans cette nuance. | `radiculopathie`, `reorientation` |
| Infiltrations | Revue Cochrane d’Oliveira et al. (2020) sur les infiltrations épidurales dans la radiculalgie : effet faible et à court terme. Le parcours propose d’adresser « pour discussion d’une infiltration » sans dire ce qu’on peut en attendre. | `radiculopathie`, `reorientation`, nouveau chapitre C2 |
| Radiofréquence facettaire | Essais MINT (Juch et al., JAMA 2017) : pas de bénéfice cliniquement pertinent de la dénervation ajoutée à l’exercice. Le chapitre dit « bénéfice débattu ». | `facettaire` |

Références anciennes à surveiller sans urgence : les chapitres
`examen-neurologique` (référence la plus récente : 2011), `ceinture-pelvienne`
(2009), `stenose` (2013) et `tests-a-abandonner` (2004, ce qui est normal pour
des études fondatrices).

## C. Ce qui manque pour « tout savoir et adapter le traitement »

### C1. La partie « que faire » des tableaux cliniques

Le répertoire des tableaux décrit très bien comment **reconnaître**. Il est
inégal sur ce qu’on **fait ensuite**, alors que c’est le cœur de l’objectif.

| Chapitre | État de la partie traitement |
|---|---|
| `radiculopathie` | **Absente.** Le chapitre passe du pronostic à la réorientation. Le traitement conservateur (neuromobilisation, préférence directionnelle, gestion de la charge, ce qu’on évite en phase irritable) n’apparaît que dans les cas cliniques et la grille. |
| `facettaire` | Partielle : « ce qui reste utilisable », sans programme. |
| `ceinture-pelvienne` | Complète pour la grossesse, absente pour la douleur sacro-iliaque hors grossesse. |
| `voisinage` | Absente pour la méralgie, les nerfs clunéaux et la tendinopathie des ischio-jambiers. |
| `stenose`, `instabilite`, `discogenique`, `rachis-opere` | Présente. |

Proposition : donner à chaque tableau une section standard « Ce qu’on fait,
ce qu’on évite, quand ça ne marche pas », avec les techniques et exercices
reliés.

### C2. Un chapitre manquant : ce que le médecin propose

Le patient arrive avec des médicaments, une infiltration prévue, un avis
chirurgical. Le thérapeute doit savoir ce que valent ces options pour en
parler juste et sans contredire le médecin : antalgiques et
anti-inflammatoires, opioïdes, myorelaxants, gabapentinoïdes, infiltrations
épidurales, radiofréquence, discectomie, décompression, arthrodèse. Pour
chacune : ce qu’on peut en attendre, ce que cela change pour la thérapie
manuelle (délais après infiltration ou chirurgie, par exemple).

Place proposée : partie « Orienter », avant `imagerie`.

### C3. Des tableaux à ajouter au répertoire

| Tableau | Pourquoi |
|---|---|
| **Fracture vertébrale ostéoporotique** | Le parcours apprend à la soupçonner (drapeaux rouges), pas à prendre en charge le patient après le diagnostic, alors qu’il revient souvent au cabinet. |
| **Douleur du grand trochanter** (tendinopathie glutéale) | Douleur latérale de hanche très fréquente, souvent prise pour une sciatique ou une douleur lombaire. Bon niveau de preuve sur la prise en charge (essai LEAP, Mellor et al., BMJ 2018). |
| **Syndrome fessier profond** (dont le « piriforme ») | Demande fréquente des patients et des praticiens. Mérite le même traitement que le psoas : ce qui est décrit, ce qui est établi, ce qui ne l’est pas. |
| **Coxarthrose** comme diagnostic de voisinage | Citée dans `stenose`, mais pas traitée comme un tableau à part entière, alors que c’est une source fréquente de douleur fessière et inguinale. |

### C4. Des populations à traiter explicitement

| Population | Ce qui existe | Ce qui manque |
|---|---|---|
| Femme enceinte et post-partum | Ceinture pelvienne | Lombalgie de grossesse hors ceinture pelvienne, précautions, positions |
| Enfant et adolescent | Spondylolyse | Drapeaux rouges propres à l’enfant (douleur nocturne, âge inférieur à 10 ans), maladie de Scheuermann |
| Sujet âgé | Sténose, spondylolisthésis | Ostéoporose et adaptation des techniques, fracture (voir C3), chutes |
| Sportif | Spondylolyse | Critères de retour au sport après un épisode lombaire |
| Travailleur | Drapeaux bleus et noirs | Retour au travail, arrêt, aménagement de poste, dialogue avec le médecin du travail |

Ces sujets peuvent former une partie « Situations particulières » de quatre ou
cinq chapitres courts, plutôt qu’être dispersés.

### C5. Les techniques

21 techniques, réparties sur trois chapitres seulement. Il manque notamment :
les techniques pour la charnière thoraco-lombaire, la sacro-iliaque, la hanche
(en lien avec la règle de Flynn et la sténose), le slider du nerf fémoral pour
les cruralgies, et les exercices de la ceinture pelvienne.

## D. Activités

15 chapitres n’ont aucune activité : `epidemiologie`, `classification`,
`douleurs-viscerales-vasculaires`, `anamnese`, `examen-physique`,
`examen-neurologique`, `discogenique`, `facettaire`, `instabilite`,
`voisinage`, `exercice-mckenzie`, `adjuvants`, `education-matching`,
`reorientation`, `cas-cliniques`.

Les plus pénalisants sont les chapitres d’examen et d’anamnèse : ce sont ceux
où l’on apprend le mieux en pratiquant. Le catalogue de scènes de
`docs/PARCOURS_ANIMES.md` y répond directement (trouver le niveau, carte des
territoires, simulateur à expressions, salle d’attente).

## Points forts à préserver

- L’axe en quatre décisions et l’ordre non négociable des questions.
- Les sections « piège » et les formulations à donner au patient, utilisables
  telles quelles.
- L’honnêteté sur les preuves : cases vides assumées, limites des
  classifications dites franchement, divergence NICE et OMS exposée plutôt
  que tranchée.
- Les courriers de réorientation types.
- Les chapitres « tests à abandonner », « fausses croyances » et « pourquoi
  tout semble marcher », rares et précieux.

## Ordre de travail proposé

1. Corrections A1 à A9 (rapides, sans nouveau contenu).
2. Section « Ce qu’on fait » des tableaux (C1), en commençant par
   `radiculopathie`.
3. Mises à jour de la section B, chapitre par chapitre, après vérification à
   la source.
4. Nouveau chapitre « Ce que le médecin propose » (C2).
5. Nouveaux tableaux (C3) et partie « Situations particulières » (C4).
6. Activités (D), en même temps que la mise en scène de chaque chapitre.
