# Dossier de présentation : projet OsteoUpgrade et MyOsteoflow

**Préparé par Kévin Thubert pour préparation de la réunion comptable**
Juin 2026

---

## 1. Objet du dossier

Ce dossier présente mon projet logiciel en vue de la réunion consacrée à la structuration juridique de l'activité. La forme envisagée est une SAS, le choix définitif sera arrêté ensemble. Le document couvre trois volets :

1. la description des deux produits et de leurs fonctionnalités,
2. la structure de coûts d'une exploitation commerciale,
3. les projections de revenus selon trois scénarios d'abonnés.

Les chiffres marqués « hypothèse » sont des estimations à affiner ensemble. Les autres montants proviennent soit des factures réelles, soit des grilles tarifaires publiques des fournisseurs.

---

## 2. Présentation du projet

Le projet s'adresse aux ostéopathes, étiopathes et chiropracteurs francophones. Il réunit deux produits vendus en un seul abonnement :

| Produit | Nature | Rôle |
|---|---|---|
| **OsteoUpgrade** | Site web (www.osteo-upgrade.fr) | Plateforme de formation continue : cours en ligne, vidéos de techniques, tests cliniques, outils de révision |
| **MyOsteoflow** | Logiciel de bureau (Windows et macOS) | Gestion de cabinet : patients, consultations, facturation, comptabilité, emails de suivi |

Le positionnement commercial consiste à remplacer environ 750 euros par an d'outils séparés (logiciel de cabinet d'un côté, formations de l'autre) par une offre intégrée à 299 euros TTC par an.

### 2.1 Tarifs pratiqués (affichés TTC)

| Offre | Prix client TTC | Observation |
|---|---|---|
| Découverte | 0 euro | Accès limité à un module d'essai (l'épaule) |
| Premium mensuel | 35 euros par mois | Accès complet aux deux outils |
| Premium annuel | 299 euros par an | Soit 24,92 euros par mois, formule mise en avant |

Deux mécanismes commerciaux complètent l'offre :

- **Parrainage** : chaque abonné annuel dispose d'un code personnel. Pour chaque filleul qui souscrit un abonnement annuel, le parrain reçoit 10 pour cent (29,90 euros) dans une cagnotte, versée par virement à partir de 50 euros. Ces versements constituent des commissions d'apporteurs d'affaires, à traiter en charges.
- **Codes promotionnels** : des remises (par exemple 100 euros sur l'abonnement annuel) peuvent être accordées via Stripe. Le chiffre d'affaires encaissé peut donc différer du tarif catalogue.

---

## 3. Fonctionnalités des deux produits

Seules les fonctionnalités effectivement accessibles dans l'interface actuelle sont décrites. Deux vidéos de démonstration accompagnent ce dossier.

### 3.1 OsteoUpgrade, la plateforme de formation

- **Tableau de bord personnalisé** : progression, niveaux, badges et série de connexions. Cette mécanique d'engagement favorise l'utilisation régulière, donc la fidélisation et le renouvellement des abonnements.
- **Cours en ligne** : formations vidéo structurées en chapitres, avec quiz de validation entre chaque vidéo et certificat en fin de parcours.
- **Pratique** : plus de 240 vidéos de démonstration de techniques, classées par région anatomique et par type de technique.
- **Revue scientifique** : synthèses mensuelles d'études en ostéopathie et thérapie manuelle, commentées pour l'application au cabinet.
- **Tests orthopédiques** : référentiel de plus de 115 tests cliniques avec vidéos, valeurs scientifiques et interprétation.
- **OsteoFlash** : plus de 350 cartes de révision à répétition espacée, avec suivi de progression.
- **Topographie** : atlas anatomique par région pour réviser les repères de palpation.
- **Parrainage et cagnotte** : suivi du code personnel, des gains et des demandes de virement.
- **Gestion du compte** : abonnement par carte bancaire, factures et résiliation en libre-service via Stripe.
- **Administration** (réservée au gérant) : gestion des utilisateurs, des contenus pédagogiques, des codes promo, des virements de parrainage, des campagnes d'emails et du support client.

### 3.2 MyOsteoflow, le logiciel de cabinet

Point structurant : toutes les données patients restent stockées sur l'ordinateur du praticien, rien ne transite par un serveur central. C'est un argument de conformité RGPD fort sur ce marché. L'accès au logiciel est contrôlé par l'abonnement : le logiciel vérifie la licence en ligne, avec une tolérance de sept jours hors connexion.

- **Patients** : fiches complètes (antécédents médicaux, chirurgicaux, traumatiques, profession, sport), recherche instantanée, archivage, import depuis un fichier ou depuis Doctolib.
- **Consultations** : anamnèse, examen clinique, tests pratiqués, schéma corporel des douleurs, conseils, historique chronologique, arbres d'aide à la décision pour les cervicalgies et lombalgies.
- **Intelligence artificielle intégrée** : dictée vocale de l'anamnèse avec transcription automatique en français, rangement automatique du texte dans les rubriques du dossier avec signalement des signes d'alerte, suggestions de tests pertinents, génération de programmes d'exercices personnalisés (PDF ou email au patient), rédaction assistée de courriers aux médecins.
- **Facturation** : factures PDF personnalisables générées depuis la consultation, envoi par email, suivi des statuts, encaissements multi-moyens et paiements fractionnés.
- **Comptabilité et statistiques** : chiffre d'affaires, panier moyen, répartition par moyen de paiement, objectifs mensuels, exports CSV et Excel, envoi de rapports par email (notamment au comptable du praticien).
- **Suivi des patients** : email automatique sept jours après chaque consultation, avec questionnaire de satisfaction dont les réponses reviennent dans le dossier.
- **Messagerie** : connexion de la boîte email du praticien pour échanger avec les patients directement dans le logiciel.
- **Formation intégrée** : accès aux contenus OsteoUpgrade depuis le logiciel.
- **Sécurité** : verrouillage par code PIN, chiffrement des identifiants, journal d'audit, sauvegardes, export et suppression des données (droits RGPD).
- **Distribution** : installateurs Windows et macOS, mises à jour automatiques en arrière-plan.

### 3.3 Articulation des deux produits

Un seul paiement donne accès aux deux outils. Le site OsteoUpgrade sert également d'infrastructure à MyOsteoflow : vérification des licences, fourniture des contenus de formation et accès aux services d'intelligence artificielle. La valeur des deux produits est donc indissociable dans l'analyse économique.

---

## 4. Coûts d'exploitation en version commercialisée

Important : le projet fonctionne aujourd'hui en grande partie sur les paliers gratuits des fournisseurs. Ces paliers ne sont pas utilisables pour une exploitation commerciale, soit contractuellement, soit en pratique. Les coûts ci-dessous correspondent donc à la configuration requise pour commercialiser, pas à la situation actuelle.

### 4.1 Coûts fixes annuels

Conversion indicative retenue : 1 dollar américain = 0,92 euro. Les fournisseurs américains facturent en dollars, un écart de change est à prévoir.

| Poste | Justification du passage en payant | Tarif fournisseur | Coût annuel estimé |
|---|---|---|---|
| Vercel Pro (hébergement du site) | Les conditions du plan gratuit Hobby excluent l'usage commercial. Le passage en Pro est obligatoire dès la commercialisation | 20 dollars par mois | 221 euros |
| Supabase Pro (base de données) | Le plan gratuit met le projet en pause après inactivité et n'offre pas de sauvegardes quotidiennes, inacceptable avec des clients payants | 25 dollars par mois | 276 euros |
| Resend Pro (envoi d'emails) | Notre système d'emailing est interne et s'appuie sur Resend. Le palier gratuit (3 000 emails par mois) sera dépassé avec les emails transactionnels, les automatisations et les relances | 20 dollars par mois | 221 euros |
| Vimeo Starter (hébergement vidéo) | Déjà souscrit, héberge les vidéos de cours et de techniques | Facture réelle | 115,20 euros |
| Apple Developer (signature macOS) | En discussion, voir le point 4.3 | 99 dollars par an | 91 euros |
| Nom de domaine osteo-upgrade.fr | Renouvellement annuel | Selon registrar | environ 15 euros |
| Cloudflare Workers (questionnaires patients) | Le palier gratuit (100 000 requêtes par jour) reste suffisant à moyen terme | 0 | 0 euro |
| GitHub (code source et distribution des mises à jour) | Gratuit | 0 | 0 euro |
| **Total des coûts fixes** | | | **environ 940 euros par an, soit 78 euros par mois** |

### 4.2 Coûts variables, proportionnels à l'activité

| Poste | Mécanisme | Hypothèse retenue |
|---|---|---|
| Stripe (encaissement) | Commission par transaction, environ 1,5 pour cent plus 0,25 euro pour les cartes européennes | 4,74 euros par abonnement annuel de 299 euros. Un abonné mensuel coûte plus cher en frais (environ 9,30 euros par an pour douze prélèvements de 35 euros) |
| Intelligence artificielle (Anthropic pour la rédaction, Groq pour la transcription vocale) | Facturation à l'usage, mutualisée sur notre clé. L'architecture utilise le modèle le plus économique avec mise en cache pour limiter la dépense | Hypothèse : 0,50 à 1,50 euro par abonné actif et par mois, à recaler sur les premières factures réelles |
| Commissions de parrainage | 10 pour cent par abonnement annuel parrainé, soit 29,90 euros par filleul | Hypothèse de travail : 30 pour cent des nouveaux abonnés annuels arrivent par parrainage. Ce paramètre est pilotable et sera suivi mois par mois |

### 4.3 Point particulier : la licence Apple Developer

L'inscription au programme Apple Developer (99 dollars par an) est en discussion. Son intérêt est le suivant : sans signature et notarisation par Apple, macOS affiche des avertissements de sécurité bloquants à l'installation de MyOsteoflow, ce qui génère des abandons à l'installation et des demandes de support. La licence permet de distribuer une application signée qui s'installe sans friction. Compte tenu de la part d'utilisateurs Mac dans les professions libérales de santé, je recommande de l'inclure au budget dès le lancement commercial. Elle est intégrée aux totaux ci-dessus.

### 4.4 Charges de structure à chiffrer ensemble

Ces postes relèvent de la création de la société et seront chiffrés en réunion, je ne les ai pas estimés moi-même : honoraires d'expertise comptable, frais de constitution de la SAS, compte bancaire professionnel, assurance responsabilité civile professionnelle (avec un volet spécifique éditeur de logiciel), éventuelle rémunération du président et cotisations associées.

---

## 5. Projections de revenus : trois scénarios

### 5.1 Hypothèses communes

- Référence : abonnement annuel à 299 euros TTC (formule mise en avant). Les abonnés mensuels (420 euros TTC par an s'ils restent douze mois) amélioreraient ces chiffres mais leur rétention est moins prévisible, je retiens l'hypothèse prudente du tout annuel.
- Frais Stripe : 4,74 euros par abonnement.
- Intelligence artificielle : fourchette de 0,50 à 1,50 euro par abonné et par mois.
- Parrainage : 30 pour cent des abonnés arrivent par parrainage, soit une commission moyenne de 8,97 euros par abonné (29,90 euros multipliés par 0,30).
- Coûts fixes : 940 euros par an (configuration commerciale complète du point 4.1).

### 5.2 Tableau de projection (première année pleine de commercialisation)

| | Scénario prudent | Scénario médian | Scénario ambitieux |
|---|---|---|---|
| Abonnés payants en fin d'année | 50 | 100 | 250 |
| Chiffre d'affaires encaissé TTC | 14 950 euros | 29 900 euros | 74 750 euros |
| Frais Stripe | 237 euros | 474 euros | 1 185 euros |
| Coût intelligence artificielle (fourchette) | 300 à 900 euros | 600 à 1 800 euros | 1 500 à 4 500 euros |
| Commissions de parrainage | 449 euros | 897 euros | 2 243 euros |
| Coûts fixes | 940 euros | 940 euros | 940 euros |
| **Total des charges d'exploitation** | **1 926 à 2 526 euros** | **2 911 à 4 111 euros** | **5 868 à 8 868 euros** |
| **Marge avant TVA, impôts et charges de structure** | **12 424 à 13 024 euros** | **25 789 à 26 989 euros** | **65 882 à 68 882 euros** |
| Taux de marge sur coûts techniques | environ 85 pour cent | environ 88 pour cent | environ 90 pour cent |

Lecture : la structure de coûts est presque entièrement fixe et faible. Chaque abonné supplémentaire coûte marginalement très peu (frais Stripe, intelligence artificielle, éventuelle commission), ce qui explique la progression du taux de marge avec le volume. C'est le profil économique classique d'un logiciel en abonnement.

### 5.3 Sensibilité

- Si la totalité des abonnés venait du parrainage (cas extrême), la commission passerait à 29,90 euros par abonné, soit 10 pour cent du chiffre d'affaires, et la marge resterait supérieure à 80 pour cent.
- Si l'usage de l'intelligence artificielle dépassait l'hypothèse haute, ce poste serait le premier à surveiller. Les factures mensuelles d'Anthropic et de Groq permettront un suivi précis dès les premiers mois.
- Les scénarios ne tiennent pas compte des codes promotionnels. Une campagne à 199 euros au lieu de 299 euros réduirait le chiffre d'affaires unitaire d'un tiers sur les ventes concernées.

---

## 6. TVA : réglementation applicable

J'ai vérifié l'état de la réglementation pour 2026. Le projet de seuil unique de franchise abaissé à 25 000 euros a été rejeté au Sénat dans le cadre du budget 2026. Les seuils en vigueur restent donc :

- **37 500 euros** de chiffre d'affaires annuel pour les prestations de services (notre cas), avec un seuil majoré de 41 250 euros,
- 85 000 euros pour les activités de vente de marchandises.

Conséquences selon les scénarios, à valider ensemble :

| Scénario | Chiffre d'affaires | Situation TVA |
|---|---|---|
| 50 abonnés (14 950 euros) | Sous le seuil | Franchise en base possible : pas de TVA à reverser, le prix TTC affiché est conservé en totalité |
| 100 abonnés (29 900 euros) | Sous le seuil | Franchise en base encore possible, mais la bascule approche : à anticiper dans la grille tarifaire |
| 250 abonnés (74 750 euros) | Au-dessus du seuil | Assujettissement obligatoire : sur un abonnement à 299 euros TTC, le chiffre d'affaires hors taxes ressort à 249,17 euros et la TVA collectée à 49,83 euros |

Deux points d'attention que je souhaite aborder en réunion :

1. **Nos clients ne récupèrent pas la TVA.** Les ostéopathes exercent une activité de soins exonérée de TVA : la TVA que nous leur facturerions serait pour eux un coût sec. Le prix affiché TTC est donc le prix perçu dans tous les cas, et le passage à l'assujettissement ampute mécaniquement notre chiffre d'affaires hors taxes d'un sixième à prix de vente constant. Le choix du moment de la bascule (et une éventuelle évolution tarifaire à cette occasion) est une décision stratégique.
2. **TVA déductible limitée.** En contrepartie, l'assujettissement permettrait de récupérer la TVA sur les achats, mais nos fournisseurs principaux sont des services américains relevant de l'autoliquidation, l'enjeu de déduction est donc modeste.

À noter également pour la réunion : en SAS, le résultat serait soumis à l'impôt sur les sociétés (taux réduit de 15 pour cent jusqu'à 42 500 euros de bénéfice sous conditions, 25 pour cent au-delà), et le régime social du président dépendra de la rémunération décidée.

---

## 7. Pièces et justificatifs

- Facture Vimeo (115,20 euros par an), déjà disponible.
- Grilles tarifaires publiques : Vercel, Supabase, Resend, Stripe, Anthropic, Groq, Apple Developer.
- Relevés Stripe mensuels (chiffre d'affaires brut, frais, net) dès les premiers encaissements.
- Deux vidéos de démonstration des produits, jointes au dossier.

## 8. Décisions attendues à l'issue de la réunion

1. Validation de la forme SAS et calendrier de constitution.
2. Position TVA au démarrage : franchise en base ou option pour l'assujettissement, et stratégie de bascule.
3. Inscription au programme Apple Developer.
4. Chiffrage des charges de structure (honoraires, assurance, banque, rémunération éventuelle).
5. Modalités de suivi : tableau de bord mensuel chiffre d'affaires, frais Stripe, coût intelligence artificielle, commissions de parrainage.
