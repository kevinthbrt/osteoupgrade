# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [1.9.0] : 2026-09-18

### Ajouté

- **Simulateur de consultation (`/regions/<slug>/simulateur`)** : un patient est tiré au sort parmi les tableaux du parcours, le praticien mène l'anamnèse en langage libre, le modèle répond dans le rôle du patient, puis le praticien décide des examens et conclut. Vingt cas pour le parcours lombaire, couvrant les dix-sept conduites possibles, de la queue de cheval à l'optimisation fonctionnelle.
- **Un modèle joue le patient, il ne décide de rien d'autre** : les résultats d'examen sont lus dans le cas, jamais produits par le modèle, et le résultat normal par défaut appartient au catalogue d'examens. Un test donne donc le même résultat à chaque fois qu'on le demande, ce qui est la condition pour que la conclusion soit corrigeable. La correction elle-même est un test d'égalité avec la conduite attendue : le modèle n'écrit que le débriefing.
- **La correction s'appuie sur l'arbre de décision** : les conclusions proposées au praticien sont lues dans le `payload` de l'activité `arbre_decision` du parcours, et la migration des cas vérifie dans sa propre transaction qu'aucune conclusion attendue n'est absente de l'arbre. Il n'y a donc pas deux vérités à tenir à jour.
- **Arbre de décision, en schéma complet** : les vingt-neuf nœuds sont dessinés d'un seul tenant, toutes les branches visibles sans rien déplier, la couleur de chaque carte terminale et de sa flèche donnant l'issue avant même la lecture. La mise en page est calculée sans bibliothèque de graphes. Un second mode déroule l'arbre question par question, pour l'appliquer à un patient précis. Il n'est noté dans aucun des deux : ce qu'il enseigne est le chemin, pas le score.
- **Cas et solutions hors de portée du navigateur** : `region_simulation_cases` contient la réponse, sa lecture est donc réservée à la clé service-role et aux administrateurs. Les sessions se lisent mais ne s'écrivent pas côté client, sinon le verdict serait modifiable par celui qu'il évalue.

- **Questionnaires cliniques (`/outils/questionnaires`)** : STarT Back, DN4, FABQ, EIFEL et Oswestry, avec leurs items, le calcul du score et la conduite qui en découle. Le module recommandait le STarT Back dès la première consultation, le simulateur en renvoyait un score et la règle de Flynn exige un FABQ-Travail : la formation demandait des outils qu'elle ne donnait pas. Les chapitres concernés y renvoient désormais. Voir `docs/QUESTIONNAIRES.md`.
- **Le calcul ne vit pas en base** : aucune de ces règles n'est une somme. Dès que le total du STarT Back atteint 4, c'est le sous-score psychosocial qui tranche et non le total ; une section d'Oswestry laissée vide sort du dénominateur au lieu de compter zéro ; le FABQ ne score que onze de ses seize items. Ces règles sont dans `lib/questionnaires.ts` et `npm run verifier:questionnaires` les vérifie, la base ne portant que les seuils.
- **Aucune réponse enregistrée** : pas de table de passation, le score s'affiche, se copie sans donnée identifiante, et disparaît. Une plateforme de formation n'a pas à devenir un dossier patient.
- **Licences suivies plutôt que supposées (`/admin/questionnaires`)** : le STarT Back demande un accord à Keele pour un usage commercial, l'Oswestry passe par le Mapi Research Trust, les trois autres sont à vérifier. L'état de chaque démarche est une colonne, l'administration alerte tant qu'elle n'est pas réglée, et la page de passation le signale au praticien.
- **Formulations remplaçables sans migration** : sauf le DN4, dont le français est la langue d'origine, les libellés sont fidèles mais ne sont pas les traductions officiellement validées. Ils se remplacent depuis l'administration le jour où la licence apporte la version officielle. Les échelles de réponse, elles, n'y sont pas modifiables : changer une valeur changerait le score sans que personne s'en aperçoive.

### Corrigé

- **Entrée « Parcours régionaux » dans la navigation** : elle n'apparaît qu'une fois un parcours publié, ou pour un administrateur. Sans cette condition, une mise en production aurait envoyé tous les abonnés vers une page vide, le parcours lombaire étant encore en brouillon.
- **Parité entre le dépôt et la base** : deux migrations appliquées sans fichier dans `supabase/migrations/` ont été ajoutées, la correction des sources officielles de juillet 2026 et l'arbre de décision. Une base reconstruite depuis les migrations produit de nouveau le même contenu que la production.

---

## [1.8.0] : 2026-09-16

### Ajouté

- **Parcours régionaux (`/regions`)** : environnements d'apprentissage par région anatomique, découpés en chapitres. Les briques existaient déjà et étaient bonnes (pathologies, tests orthopédiques, clusters, vidéos de pratique, exercices) ; ce qui manquait, c'était le fil. Un praticien qui voulait devenir compétent sur la lombalgie devait ouvrir quatre modules distincts et deviner l'ordre dans lequel les parcourir. Voir `docs/PARCOURS_REGIONAUX.md`.
- **Aucune donnée clinique dupliquée** : un chapitre cite les briques, il ne les recopie pas. Un test reste dans `orthopedic_tests`, une vidéo dans `practice_videos`. Corriger une sensibilité à un seul endroit continue de corriger tout le site, la fiche du test comme les chapitres qui la citent. C'est la raison pour laquelle le module est une couche de liaison et non un nouveau référentiel.
- **Module « Région lombaire »** : 26 chapitres, 133 sections, 98 références, de l'épidémiologie aux cas cliniques intégratifs, en passant par les drapeaux rouges, la queue de cheval, les douleurs viscérales, la lombalgie inflammatoire, l'examen neurologique et neurodynamique, les sept tableaux diagnostiques (radiculopathie, sténose, discogénique, facettaire, instabilité, ceinture pelvienne, diagnostics de voisinage), le traitement fondé sur les preuves et la réorientation.
- **Une technique existe avant sa vidéo** : `region_chapter_techniques` porte le catalogue des gestes recommandés indépendamment de ce qui est filmé. Refuser d'écrire une technique tant que la vidéo n'existe pas aurait amputé le contenu de tout ce qui est recommandé mais pas encore tourné, SNAG de Mulligan, protocole McKenzie complet, puncture sèche, neuromobilisation. `to_film` marque ce qui reste à produire, `film_brief` dit ce que la vidéo doit montrer. Sur les 21 techniques du parcours lombaire, 10 sont reliées à une démonstration existante et 11 attendent d'être tournées.
- **Liste de tournage (`/admin/regions`)** : les techniques en attente, avec leur brief, et l'association en un clic à une vidéo de la bibliothèque. Associer remplit `practice_video_id` et repasse `to_film` à faux : la liste se vide d'elle-même.
- **Publication contrôlée** : un module en `draft` n'est lisible que des administrateurs, la policy de lecture laissant passer `is_admin()`. Le contenu clinique est relu avant d'être servi aux abonnés. Le parcours lombaire est livré en brouillon.
- **Compléments au référentiel de tests** : items des règles de prédiction clinique de Flynn et de Hicks, Active Straight Leg Raise, mouvements aberrants lombaires, Schober modifié, test du tapis roulant en deux temps, hyperextension unipodale, palper-rouler de la charnière thoraco-lombaire, hypomobilité segmentaire, signe de la sonnette. Plus trois clusters : règle de Flynn, règle de Hicks, faisceau d'arguments de radiculopathie. Ces fiches profitent aussi au module `/tests`.
- **Sensibilité et spécificité renseignées seulement quand elles existent** : les colonnes restent vides lorsque la littérature ne donne pas de chiffre stable sur une population définie, et l'explication passe dans `interest`. Un chiffre inventé serait pire que pas de chiffre, il serait utilisé pour décider. Le chapitre « Décider avec des probabilités » dit explicitement au lecteur qu'une case vide est un choix.
- **Progression par chapitre** : `region_chapter_progress`, une ligne par chapitre terminé, reprise dans le sommaire et sur la carte du parcours.
- **Partie « Déjouer les pièges »** : trois chapitres sur ce qu'il faut désapprendre. Les tests de position et de mobilité à abandonner, en partant du test des pouces : la sacro-iliaque bouge d'environ deux degrés et un à deux millimètres, la fiabilité inter-examinateurs est faible, et l'asymétrie des repères pelviens est banale chez des sujets sans douleur. Les fausses croyances transmises aux patients, avec une formulation de remplacement pour chacune. Et les biais de raisonnement qui font que tout semble marcher, régression vers la moyenne en tête.
- **Activités interactives** : QCM, vrai-faux, tri de situations par degré d'urgence, cas cliniques guidés étape par étape avec correction à chaque choix, et un calculateur de probabilité post-test. Quatorze activités sur le parcours lombaire. Le score n'est pas une note, il sert à savoir ce qui reste à revoir : les réponses sont enregistrées en dernier état, sans historique, et une activité se refait autant de fois qu'on veut.
- **Les rapports de vraisemblance ne sont jamais saisis à la main** : le calculateur ne stocke que la sensibilité et la spécificité lues sur les fiches de tests, et recalcule les rapports à l'affichage. Un chiffre corrigé sur une fiche corrige l'exercice, et l'exercice ne peut pas contredire la fiche qu'il cite.
- **Vidéo sur les fiches de tests** : la vignette YouTube du test s'affiche dans le chapitre, à côté de sa sensibilité et de sa spécificité, et se lance au clic. Les fiches sans vidéo s'affichent sans, et la vignette apparaît d'elle-même le jour où l'URL est renseignée.
- **Sources primaires vérifiées et liées** : la fiche mémo de la HAS de 2019, jusque-là absente alors qu'elle est la référence opposable en France, la NG59 du NICE et le guide 2023 de l'OMS. Les références des chapitres portent désormais l'URL de l'émetteur.
- **L'axe du parcours change** : la partie diagnostique était organisée par tissu parce que la table `pathologies` l'est, alors que trois de ses chapitres expliquent qu'aucun test ne permet d'identifier le tissu source de façon fiable. Le parcours enseignait une chose et s'organisait selon son contraire. La colonne vertébrale devient ce qui décide réellement du traitement : est-ce que cela relève de moi, quel mécanisme de douleur domine, quel profil de réponse au traitement, quel risque de chronicisation.
- **Nouvelle partie « Classer pour décider »** : trois chapitres placés avant les tableaux cliniques. Les mécanismes de douleur (nociceptif, neuropathique, nociplastique) avec les critères IASP et ceux de Kosek 2021, dont l'hypersensibilité évoquée obligatoire. Le profil de réponse au traitement selon la classification de Delitto révisée par Alrwaily en 2016. Et la grille de décision qui croise les quatre axes, avec la conclusion de consultation en quatre lignes.
- **Les chapitres tissulaires deviennent un répertoire** : ils ne sont pas supprimés, leur contenu est bon et il faut savoir reconnaître ces tableaux. La partie s'appelle « Répertoire des tableaux cliniques » et le chapitre « croiser les axes » dit à quoi elle sert : reconnaître ce qui se distingue vraiment, savoir ce qu'on ne peut pas affirmer, et affiner une première intention après que les axes sont posés.
- **Chapitre « Le rachis lombaire opéré »** : il manquait. Terminologie actuelle (« syndrome douloureux rachidien persistant de type 2 » remplace « syndrome d'échec de la chirurgie du dos », qui nomme un échec et désigne un coupable), recherche systématique des composantes neuropathique et nociplastique, travail des segments adjacents et des hanches, et objectif annoncé en gain de fonction plutôt qu'en disparition de la douleur.
- **Quatre activités pour les nouveaux chapitres**, dont un tri de six patients par mécanisme dominant, un tri par profil de traitement, et un cas guidé qui déroule les quatre axes sur une lombalgie de trois ans. Le tri bascule sur une palette neutre quand ses catégories ne sont pas des degrés de gravité : un dégradé rouge vers vert suggérerait une hiérarchie qui n'existe pas entre trois mécanismes de douleur.
- **Grille HAS par durée et par risque** : poussée aiguë, lombalgie à risque de chronicité, lombalgie chronique. La catégorie intermédiaire est celle sur laquelle on peut encore agir, et c'est celle qui disparaît quand on raisonne seulement en aigu contre chronique.

### Corrigé

- **Mise à jour du NICE du 29 juillet 2026** : le module présentait comme actuelles deux recommandations que le NICE a retirées, sur les thérapies psychologiques (1.2.13) et les programmes combinés physiques et psychologiques (1.2.14), en partie parce que des travaux qui les fondaient ont été rétractés. Les chapitres concernés ont été repris, et une section explique la divergence qui subsiste avec l'OMS, qui maintient l'option en recommandation conditionnelle. Dire qu'une recommandation a changé, et pourquoi, vaut mieux qu'une liste tranchée.
- **Thérapie manuelle** : la recommandation 1.2.7 amendée est désormais citée dans sa forme actuelle, « uniquement dans le cadre d'un programme de traitement qui comprend de l'exercice », sans la mention « avec ou sans thérapie psychologique » qu'elle portait.
- **Imagerie** : la position de la HAS manquait. Une IRM est recommandée au delà de trois mois d'évolution, ce que le chapitre ne disait pas, avec l'explication à donner au patient sur l'absence de corrélation systématique entre signes radiologiques et symptômes.

- **« Tight thrust test »** devient **« Thigh thrust test »** dans le référentiel des tests sacro-iliaques. La coquille était visible des abonnés sur une fiche clinique ; le nom n'est qu'un libellé d'affichage, aucune requête ne s'y appuyait.

---

## [1.7.0] : 2026-09-08

### Ajouté

- **Suivi des clients (`/admin/clients`)** : nouveau module d'administration qui répond à ce que `profiles` seul ne permettait pas de savoir : ce compte a-t-il pris l'essai, l'a-t-il annulé et pourquoi, quelle offre a-t-il prise, et que lui a-t-on déjà écrit. Tableau triable sur toutes les colonnes, filtres par étape du cycle de vie, offre et étiquette, sélection multiple, export CSV de la liste affichée. Voir `docs/SUIVI_CLIENTS.md`.
- **Chronologie client (`customer_events`)** : `profiles` ne porte que l'état courant, un compte résilié y est indiscernable d'un compte jamais converti. Les inscriptions (trigger SQL), les essais, abonnements, changements d'offre, renouvellements, impayés et résiliations (webhook Stripe) laissent désormais une trace datée. Les comptes existants ont été rattrapés depuis leurs dates connues, marqués `source = 'backfill'`.
- **Motif de résiliation conservé** : le motif et le commentaire saisis dans le portail client Stripe étaient lus dans la notification à l'administrateur puis perdus. Ils sont stockés sur l'événement `canceled`, affichés sur la fiche et agrégés en tête du module.
- **Envoi d'emails depuis la fiche client** : message libre au gabarit maison avec champs de fusion (`{{prenom}}`, `{{nom}}`, `{{offre}}`) et bouton facultatif, à un compte ou à une sélection. Chaque envoi laisse une ligne dans `customer_emails`, échecs compris : un email refusé par Resend reste visible, plutôt que de faire croire à une relance jamais reçue.
- **Enquêtes « pourquoi ? »** : quatre questions prédéfinies selon l'étape du parcours (pourquoi ne pas s'être abonné, pourquoi l'essai a été annulé, pourquoi la résiliation, satisfaction notée de 1 à 5). Chaque destinataire reçoit un lien personnel ouvrant `/avis/<token>`, sans connexion : exiger un compte pour répondre à « pourquoi êtes-vous parti ? » écarterait précisément les personnes interrogées. Les réponses sont regroupées dans un onglet dédié, avec le classement des motifs les plus cités.
- **Suivi des ouvertures et des clics** : nouveau webhook `POST /api/emails/events` (signature Svix, secret propre dans `RESEND_EVENTS_WEBHOOK_SECRET`, Resend en attribuant un par point de terminaison). Demande aussi d'activer *Open Tracking* et *Click Tracking* sur le domaine, sans quoi les événements d'ouverture n'existent pas. Faute de ces réglages un email reste au statut « envoyé » : on saurait qu'il est parti, jamais s'il a été lu.
- **Onglet « À traiter » et voyants d'action** : le module ouvre désormais sur ce qu'il y a à faire, pas sur un annuaire. Huit signaux calculés (essai qui se termine, impayé, départ récent jamais interrogé, abonné sans connexion depuis 45 jours, réponse d'enquête laissée sans suite, essai ou inscription sans la moindre relance, adresse en échec), triés par urgence, avec la raison écrite en clair et le bouton correspondant. Un point de couleur reprend le signal le plus urgent dans la liste complète.
- **L'usage de MyOsteoFlow compte enfin** : `last_login_date` ne mesurait que les visites du site, alors qu'un abonné MyOsteoFlow travaille dans le logiciel sans jamais l'ouvrir. Le module désignait donc comme dormant le client le plus assidu : vérification faite sur la base, le seul signal « abonné dormant » qui s'allumait était ce faux positif. La vue lit désormais `osteoflow_sessions.last_active_at`, rafraîchi à chaque vérification de licence.
- **Les deux usages restent distincts** : site et logiciel sont mesurés séparément dans la vue comme dans la fiche, les fusionner perdrait ce qu'ils ont d'intéressant. Deux signaux en découlent : « payé, jamais ouvert » pour un abonné qui n'a jamais lancé un produit qu'il paie, et « moitié de son offre inutilisée » pour une offre Premium dont un seul des deux produits sert. `last_activity_at` n'agrège les deux que pour repérer un silence complet.
- **Des voyants qui s'éteignent seuls** : chaque signal porte une fenêtre qui se referme et s'éteint dès qu'un contact lui est postérieur, email envoyé d'ici ou action consignée à la main, sans rien à cocher. Sans ces deux règles la moitié des comptes brilleraient en permanence, on cesserait de les regarder, et les voyants deviendraient du papier peint. La vue expose `last_contact_at`, qui agrège les emails partis et les contacts consignés sur un autre canal : ne regarder que les emails éteindrait un signal sur un appel jamais passé, et le maintiendrait allumé après un appel passé.
- **Consigner ce qui s'est passé hors du module** : bouton *Consigner*, sur une fiche ou sur une sélection. Inscrit dans la chronologie, à une date passée choisie, une relance partie de votre boîte, un appel, un message, une réponse reçue ailleurs, ou le motif de départ d'une résiliation antérieure. Sans cette saisie, la fiche d'une personne relancée trois fois affirmait « jamais relancé » et le filtre du même nom la remontait en tête des comptes à contacter : une fiche fausse est pire qu'une fiche vide, elle fait agir à tort. Les entrées consignées sont les seules supprimables, un événement Stripe étant un fait et non une saisie.
- **`emails_tracked` distinct de `emails_sent`** : un email consigné n'aura jamais de statut d'ouverture, rien ne pouvant être mesuré d'un message parti d'ailleurs. Le filtre « sans réaction » ne compte que les envois réellement suivis, faute de quoi il affirmerait « relancé, aucun signe de vie » là où la vérité est « nous n'en savons rien ».
- **Un essai annulé n'est pas une résiliation** : la vue distingue `trial_canceled` de `canceled`. Sans cette séparation, un compte ayant abandonné son essai était classé « résilié » et se voyait proposer l'enquête « pourquoi avez-vous résilié votre abonnement ? », sur un abonnement qu'il n'a jamais eu, tandis que l'enquête portant sur l'essai devenait inatteignable.
- **Un envoi refusé n'est pas une relance** : `emails_sent` excluait déjà les statuts `failed`, exposés à part dans `emails_failed` et remontés en indicateur. Les compter comme des envois sortait la personne de « jamais relancé », donc on cessait de la relancer, et la faisait entrer dans « sans réaction » comme si elle avait ignoré un message jamais reçu.
- **Notification à chaque réponse d'enquête** : la cloche admin porte désormais la réponse elle-même (motif, note, début du texte libre), et pas seulement le fait qu'il y en ait une. Une réponse qui n'arrive nulle part défait l'intérêt d'avoir posé la question : personne ne consulte un onglet « Réponses » au hasard, et un client qui vient d'expliquer son départ est celui qu'on peut encore rappeler.
- **Notes internes et étiquettes** : annotations libres par compte et étiquettes de segmentation (`profiles.admin_tags`), filtrables depuis la liste.
- **Listes de travail** : filtres rapides « jamais relancé », « n'ouvre jamais », « inactif 30 jours » et « enquête sans réponse », plus le taux de conversion des essais, que rien ne mesurait jusqu'ici.

---

## [1.6.0] : 2026-09-03

### Ajouté

- **`/api/osteoflow/live-anamnesis`** : extraction incrémentale d'une anamnèse dictée, pour le mode consultation de MyOsteoFlow. Reçoit un passage qui vient d'être prononcé et l'état des lignes déjà relevées avec leur identifiant ; renvoie des opérations (`add`, `update`, `remove`) sur ces lignes plutôt qu'une nouvelle synthèse. C'est ce qui permet à « c'est à gauche, ah non pardon à droite » de corriger la ligne existante au lieu d'en empiler une seconde qui la contredirait : deux lignes contradictoires sont pires que pas de ligne du tout.
- **Texte libre, axes fermés** : le texte des lignes n'est soumis à aucun vocabulaire, imposer un lexique abîmerait la formulation et n'est pas nécessaire pour afficher. Seul l'AXE de chaque ligne est pris dans une liste fermée de quinze valeurs, parce qu'il sert ensuite à dire ce qui manque et qu'on ne détecte pas une absence sans référence. Cette liste est générique et non régionale : une liste par pathologie demanderait un développement par région et se périmerait.
- **Dépistage des drapeaux rouges en direct** : seule exception à la règle de non-déduction, reprise du prompt de structuration. Le passage est passé en revue pour les dix familles de signaux d'alerte, y compris par recoupement, et mieux vaut signaler par excès que manquer un signe.
- **Confiance et verbatim par ligne** : une transcription douteuse est marquée et accompagnée des mots du patient, sans reformulation, pour que le praticien tranche sans redemander.
- **Modèle et cache** : Haiku par défaut, réglable par `LIVE_ANAMNESIS_MODEL`. La route étant appelée toutes les dix à quinze secondes pendant une consultation, le prompt système est mis en cache pour ne pas être repayé à chaque passage, et une réponse illisible renvoie une liste d'opérations vide plutôt que d'interrompre la dictée.

---

## [1.5.0] : 2026-09-03

### Ajouté

- **Structuration d'anamnèse : phrase de synthèse** : `/api/osteoflow/ai` renvoie désormais un champ `summary` en plus du motif et des cartes. Une phrase de vingt-cinq mots au plus, au style télégraphique, écrite pour être relue à voix haute au patient en fin d'interrogatoire : il confirme ou corrige lui-même, ce qui vérifie à la source au lieu de faire relire trente items au praticien. L'ordre est imposé (motif, ancienneté, circonstance, localisation et côté, intensité, irradiation, drapeaux rouges) et la phrase ne peut contenir aucun fait absent des cartes. (`app/api/osteoflow/ai/route.ts`)
- **`/api/osteoflow/summarize-anamnesis`** : nouvelle route, protégée par le même secret de proxy, qui produit cette phrase à partir de cartes DÉJÀ structurées. Elle sert la reprise des consultations antérieures de MyOsteoFlow, dont les cartes sont en base mais qui ont été traitées avant l'existence du champ `summary`. Résumer des faits déjà relevés n'est pas une tâche de raisonnement : le modèle est Haiku, réglable par `SUMMARY_MODEL`. Les items valant « — » (sujet non abordé) ne sont pas transmis, les transmettre ferait passer une absence pour un fait. Tailles bornées à l'entrée (20 rubriques, 40 items, 500 caractères).

### Amélioré

- **Marge de sortie de la structuration** : `max_tokens` passe de 3000 à 3200. La réponse porte maintenant le texte markdown, le tableau des sections ET la phrase de synthèse ; une anamnèse longue tronquait sinon le JSON, ce qui faisait retomber le client sur un affichage sans cartes.

---

## [1.4.0] : 2026-09-02

### Ajouté

- **Funnels : pages de vente éditables** : nouveau module `/f/<slug>`, créé et modifié depuis **Administration → Funnels** sans redéploiement. Onze types de blocs (accroche, vidéo, bénéfices, témoignages, programme, tarifs, garantie, FAQ, appel à l'action, capture email, texte), réordonnables. Contenu stocké en JSONB, validé par `funnelInputSchema`. (`app/f/[slug]/`, `app/admin/funnels/`, `components/funnel/`, `lib/funnels.ts`)
- **Capture de leads sans compte** : bloc formulaire alimentant `mail_contacts` via `triggerAutomations`, donc la même liste de diffusion que l'inscription. Chaque opt-in déclenche les automatisations dont le déclencheur vaut `funnel:<slug>` : une séquence par campagne, créée dans Automatisations sans écrire de code. (`app/api/funnels/lead/`)
- **Échéance d'offre** : aucune, date fixe commune, ou J+N propre à chaque lead (offre permanente à fenêtre individuelle). Compte à rebours dans les blocs accroche, tarifs et appel à l'action. Un renvoi du formulaire ne repousse pas l'échéance.
- **Attribution des campagnes (UTM)** : les paramètres UTM sont captés à l'arrivée dans le cookie premier-partie `ou_attrib` (90 jours, premier contact conservé) et réinjectés dans les metadata de la session et de l'abonnement Stripe. Une vente est désormais rattachable à la campagne qui l'a produite. (`lib/utm.ts`)
- **Mesure par funnel** : vues, clics CTA, opt-ins et départs au paiement, avec la liste des derniers leads et leur campagne. (`app/api/funnels/track/`)
- **Tables `funnels`, `funnel_leads`, `funnel_events`** : RLS admin uniquement, aucune politique `anon` : le rendu public passe par la clé service-role, qui filtre sur `status = 'published'`. (`supabase/migrations/20260902_funnels.sql`)
- **Funnel d'exemple « épaule »** : page `/f/examen-clinique-epaule` (créée en brouillon) et sa séquence de 5 emails sur 9 jours, fournie en migration non appliquée (`20260902_funnel_epaule_sequence.sql`), inactive à la création. S'appuie sur la formation « Examen clinique de l'épaule basé sur les preuves » déjà offerte aux comptes gratuits.
- **Filigrane de marque** en fond d'accroche : la sphère du logo en débord à droite (`public/logo-mark.png`, extraite du lockup existant), activable par case à cocher.
- **Fond clair ou sombre** pour l'accroche et le rappel final, au choix dans l'éditeur. Le clair devient le défaut : dégradé bleu très pâle vers blanc, halos de marque atténués, texte ardoise.
- **Bloc « Photo »** : envoi d'image vers Vercel Blob depuis l'éditeur (`/api/funnels/image-upload`, admin uniquement, SVG exclu), avec texte alternatif, légende et affichage pleine largeur ou dans la colonne de lecture. Le champ image de l'accroche, déclaré mais jamais rendu ni saisissable, est branché du même coup.
- **Aperçu des brouillons** : `/f/<slug>?preview=1`, réservé aux admins connectés, pour relire une page avant de la publier. (`lib/supabase-server-helpers.ts` : ajout de `createServerComponentClient`)
- **Documentation** : `docs/FUNNELS.md`.

### Corrigé

- **Funnels : compteurs plafonnés en silence** : vues et leads étaient comptés à partir des lignes ramenées par PostgREST, dont le nombre est plafonné par requête. Au-delà de ce plafond les chiffres se seraient figés sans erreur, sur des données servant à décider. L'agrégation passe dans la fonction SQL `funnel_stats`, vérifiée à 2 500 vues et 1 400 leads. (`supabase/migrations/20260902_funnel_stats.sql`)
- **Funnels : brouillon en 404 sans explication** : l'éditeur présentait l'URL d'un funnel non publié comme un lien ordinaire, qui renvoyait une 404 sans dire pourquoi. L'URL pointe désormais vers `/f/<slug>?preview=1` tant que la page n'est pas en ligne, le statut est explicite (« Brouillon (404 pour les visiteurs) ») et un rappel invite à publier. L'aperçu est réservé aux admins connectés et affiche un bandeau d'avertissement.
- **Funnels : l'email capté n'entrait pas dans la liste de diffusion** : `triggerAutomations` sort dès qu'aucune séquence active ne correspond à l'événement, donc avant sa propre création de contact. Un formulaire dont la séquence n'était pas encore écrite : l'état normal juste après la publication d'une page : enregistrait le lead sans jamais créer le contact. La résolution du contact est extraite dans `ensureMailContact()` et appelée avant toute recherche de séquence. (`lib/automation-triggers.ts`, `app/api/funnels/lead/route.ts`)
- **Funnels : offre datée encore achetable après la fin** : `/api/stripe/checkout` ne vérifiait aucune échéance ; le compte à rebours n'engageait que le navigateur. La route résout désormais le funnel côté serveur et refuse une offre expirée (date fixe ou échéance individuelle du lead), ainsi qu'une offre ne correspondant pas à celle annoncée par la page.
- **Funnels : URL de CTA non filtrée** : `ctaUrl` n'était validé que comme texte court et était assigné à `window.location.href`. Une URL `javascript:` enregistrée en base s'exécutait donc dans l'origine de l'application au premier clic. Les liens sont restreints à `http(s)` à l'enregistrement et au clic (`safeLinkUrl`).
- **Funnels : attribution contradictoire** : lorsqu'un visiteur déjà attribué à une campagne rouvrait la page avec d'autres paramètres UTM, le cookie conservait bien la première campagne mais les leads et événements enregistraient la seconde. Le cookie fait désormais foi partout.
- **Funnels : séquence impossible à créer depuis l'interface** : l'éditeur renvoyait vers Administration → Automatisations, qui ne sait que lister et activer des séquences existantes (aucun écran n'appelle `POST /api/automations`). L'éditeur crée maintenant la séquence et son déclencheur, et signale explicitement qu'une séquence sans étape n'envoie rien.

### Amélioré

- **Parcours d'achat depuis un funnel** : `/auth` accepte `?plan=` et `?funnel=` et enchaîne sur le paiement Stripe dès le compte créé, au lieu de renvoyer au tableau de bord : le visiteur n'a plus à retrouver l'offre qu'il venait d'accepter.
- **Middleware** : les pages `/f/` sont exclues du contrôle de session, qui ajoutait une lecture Supabase à chaque visite sur les pages où la vitesse d'affichage se paie en conversions.

---

## [1.3.0] — 2026-05-25

### Ajouté

- **Notifications admin temps réel** : cloche dans la sidebar (section Administration uniquement) avec badge de non-lus. Panel slide-over droit listant les notifications par type (bug report, nouvel abonnement, parrainage). Marquage lu / tout lire. Alimentation automatique via Supabase Realtime (INSERT sur `admin_notifications`). (`components/AdminNotificationBell.tsx`, `lib/admin-notify.ts`)
- **Table `admin_notifications`** : migration Supabase avec RLS admin-only et publication realtime. (`apply_migration: create_admin_notifications`)
- **Bannière bêta** : bandeau visible sur toutes les pages avec bouton "Signaler un problème". Modal avec champ email optionnel et description. Envoi vers `ADMIN_EMAIL` via Resend + notification interne temps réel. (`components/BetaBanner.tsx`, `app/api/bug-report/route.ts`)
- **Notif admin nouvel abonnement** : le webhook Stripe insère automatiquement une notification interne à chaque `checkout.session.completed`. (`app/api/stripe/webhook/route.ts`)

### Amélioré

- **Landing page — OsteoFlow** : repositionné de "Bonus #1" à "Inclus avec Premium" avec 6 fonctionnalités détaillées (dossiers patients, consultations, prise de note par IA, objectifs cabinet, comptabilité, statistiques).
- **Landing page — Tarifs** : section comparatif et section tarifs fusionnées en un seul bloc. Calcul transparent affiché : 300 + 200 + 250 = 750€/an vs 240€/an OsteoUpgrade.
- **Landing page — Philosophie** : section preuve sociale remplacée par "Notre philosophie" (3 piliers : EBP, pratique cabinet, évolution mensuelle).
- **Footer public** : "Séminaires" supprimé des Ressources, lien "Modules" → "OsteoFlow" (`/#osteoflow`), accents corrigés dans la description.
- **Navigation utilisateur** : module Exercices retiré du menu (sera intégré à OsteoFlow à terme).

### Corrigé

- **Landing page** : tous les accents manquants corrigés (`référence`, `Développée`, `orthopédiques`, `détaillées`, etc.), tirets cadratins supprimés, lien nav "Modules" → "OsteoFlow" corrigé.
- **Landing page** : "Diagnostics & Pathologies" retiré de la liste des fonctionnalités (module non encore disponible aux utilisateurs).
- **Landing page — Outils professionnels** : description nettoyée des références aux fiches exercices patients.

---

## [1.2.0] — 2026-02-28

### Ajouté

- **Comptes free — navigation débloquée** : E-Learning, Pratique et Outils accessibles depuis la sidebar ; le contenu premium reste flouté page par page via `FreeContentGate`.
- **Comptes free — "Passer Premium"** : bouton doré animé dans la sidebar et bandeau d'upgrade sur le dashboard.
- **Revue de littérature** : articles non-épaule floutés pour les comptes free (cohérence avec Pratique et Tests).

### Corrigé

- **Quiz — verrouillage inter-chapitres** : `isSubpartAccessible` ne propageait pas le verrou entre chapitres. Remplacé par `computeAccessibleSubparts` (Set propagé). (`app/elearning/cours/page.tsx`)
- **Quiz — données vides pour les free** : politiques RLS trop restrictives empêchaient les comptes free de lire les quizzes. Nouvelle migration `20260228_free_user_quiz_access.sql` : les free peuvent lire les quizzes des formations `is_free_access = true`.
- **Pratique — `isVideoLocked` manquant** : variable perdue lors du merge avec conflit, corrigée dans la foulée.

---

## [1.1.0] — 2026-02-28

### Ajouté

- **Parrainage** : page `/parrainage` dédiée accessible à tous, contenu adapté au rôle (Gold : code + gains + cagnotte ; Silver : teasing Gold ; Free : CTA offres). Lien dans la navigation pour tous.
- **Admin — Codes promo** : page `/admin/promo` pour générer des codes Stripe -100€ sur Gold (personnalisable, nb d'utilisations, barre de progression, désactivation).
- **Checkout Stripe** : champ code promo visible lors du paiement (`allow_promotion_codes`).
- **Parrainage avant paiement** : rappel de code affiché avant redirection Stripe, passage sans code possible.
- **Miniatures Vimeo** : récupération serveur via oEmbed (`vimeo_id`, `thumbnail_url`, `duration_seconds`) pour éviter les cartes noires.
- **Module Pratique** : lecteur vidéo en modal, formulaire admin en modal, gestion catégories en modal, onglets régions avec retour à la ligne, pagination (12/page), région "Bassin", fusion "Pied & Cheville".
- **Footer** : présent sur toutes les pages avec liens légaux (Mentions légales, CGU/CGV, Confidentialité).
- **Bandeau cookies RGPD** : consentement à la première visite, mémorisé en localStorage.
- **Liens légaux** dans la sidebar sous le bouton déconnexion.
- **Mot de passe oublié** : lien sur l'écran de connexion + page dédiée.
- **Fenêtre changelog admin** : popup automatique à chaque mise à jour pour les administrateurs.
- **Tests orthopédiques** ajouté dans la navigation E-Learning.

### Amélioré

- **CGU** : tarifs corrects (Silver 29€/mois ou 240€/an, Gold 499€/an), suppression engagement 12 mois, section Programme Ambassadeur Gold.
- **Emails** : tarifs et conditions alignés avec les CGU.
- **Module Pratique** : ordre d'affichage automatique si champ laissé vide.
- **Page abonnement** : section parrainage enrichie selon le rôle.
- **Parrainage Silver mensuel** : codes non proposés sur l'offre mensuelle.

### Corrigé

- Sécurité — trigger gamification passé en `SECURITY DEFINER` (erreur 403 progression vidéo).
- CSP — autorisation du widget Vercel Live.
- Programme ambassadeur — virement bancaire dès 50€ cumulés (pas un crédit plateforme).
- Revue de littérature — retours à la ligne respectés dans l'affichage des articles.
- Module Pratique — bug qui chargeait toujours la première vidéo au lieu de celle cliquée.
- Module Pratique — fallback visuel si miniature échoue au chargement.
