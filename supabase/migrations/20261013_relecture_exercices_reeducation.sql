-- Relecture de la bibliothèque d'exercices de rééducation (rehab_exercises).
-- Descriptions réécrites pour le patient (position, mouvement, repère, erreur à éviter),
-- progressions en phrases complètes, noms sans tiret ni jargon, régions regroupées,
-- et 16 exercices ajoutés pour les protocoles du générateur IA.
-- Les noms repères des protocoles (Isométrie, lourd lent (HSR), excentrique, Copenhagen plank,
-- Star Excursion, Équilibre, Press-up lombaire, Respiration diaphragmatique...) sont conservés.

begin;

update rehab_exercises set
  description = $q$Allongé sur le dos, bras tendus vers le plafond, hanches et genoux pliés à 90°. Plaquez doucement le bas du dos au sol, puis tendez lentement un bras vers l’arrière et la jambe opposée vers l’avant, et revenez. Le bas du dos ne se décolle pas du sol. Respirez normalement.$q$,
  progression_regression = $q$Plus facile : ne bougez que les jambes, en glissant le talon au sol. Plus difficile : descendez la jambe plus près du sol, sans que le dos se creuse.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Dead bug$q$;

update rehab_exercises set
  description = $q$En appui sur les avant-bras et les genoux, coudes sous les épaules. Alignez la tête, le dos et les cuisses en serrant légèrement le ventre, et tenez la position. Le bas du dos ne se creuse pas et les fesses ne montent pas. Respirez calmement.$q$,
  progression_regression = $q$Plus facile : debout, avant-bras contre un mur. Plus difficile : sur les pieds, jambes tendues.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Planche modifiée$q$;

update rehab_exercises set
  description = $q$Allongé sur le côté, appuyé sur l’avant-bras, coude sous l’épaule, genoux pliés. Soulevez le bassin pour aligner la tête, le buste et les genoux, puis tenez. Le bassin ne tombe pas et ne part pas vers l’arrière. Faites les deux côtés.$q$,
  progression_regression = $q$Plus facile : tenez moins longtemps. Plus difficile : jambes tendues, appui sur les pieds.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Gainage latéral modifié$q$;

update rehab_exercises set
  description = $q$Debout de profil par rapport à l’ancrage de l’élastique, mains jointes contre la poitrine. Poussez les mains droit devant vous, tenez 2 secondes, puis ramenez-les. Le buste ne tourne pas vers l’ancrage : vous résistez à la rotation. Faites les deux côtés.$q$,
  progression_regression = $q$Plus facile : rapprochez-vous de l’ancrage. Plus difficile : éloignez-vous ou prenez un élastique plus fort.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Pallof press élastique$q$;

update rehab_exercises set
  description = $q$Prenez une charge dans une seule main (sac de courses, haltère). Marchez droit, à allure normale, épaules à la même hauteur et buste vertical. Ne vous penchez pas du côté opposé à la charge. Changez de main à chaque aller.$q$,
  progression_regression = $q$Plus facile : charge plus légère, trajet plus court. Plus difficile : charge plus lourde, trajet plus long.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Carry unilatéral léger$q$;

update rehab_exercises set
  description = $q$Une charge dans chaque main, bras le long du corps. Marchez en vous tenant grand, épaules basses, regard droit devant. Gardez des pas réguliers sans balancer le buste.$q$,
  progression_regression = $q$Plus facile : charges plus légères, trajet plus court. Plus difficile : charges plus lourdes, trajet plus long.$q$,
  region = $q$Tronc$q$,
  updated_at = now()
where name = $q$Farmer carry léger$q$;

update rehab_exercises set
  description = $q$Assis au fond de la chaise, pieds à plat. Imaginez un fil qui tire le sommet du crâne vers le plafond : grandissez-vous sans lever le menton, épaules relâchées. Tenez 20 à 30 secondes en respirant normalement.$q$,
  progression_regression = $q$Plus facile : 10 secondes. Plus difficile : tenez plus longtemps, ou faites-le debout.$q$,
  updated_at = now()
where name = $q$Auto-grandissement assis$q$;

update rehab_exercises set
  description = $q$Assis ou debout, regard à l’horizontale. Reculez doucement la tête en rentrant le menton, comme pour faire un double menton, sans pencher la tête vers le bas. Tenez quelques secondes, puis relâchez. Le mouvement est petit et ne fait pas mal.$q$,
  progression_regression = $q$Plus facile : très petite amplitude. Plus difficile : tenez 10 secondes.$q$,
  updated_at = now()
where name = $q$Double menton (chin tuck)$q$;

update rehab_exercises set
  name = $q$Étirement de l’élévateur de la scapula$q$,
  description = $q$Assis, tenez le bord de la chaise avec la main du côté à étirer. Tournez la tête vers l’aisselle opposée et regardez vers le bas, puis posez l’autre main sur l’arrière du crâne pour ajouter un léger poids. Vous sentez l’étirement entre la nuque et l’omoplate, jamais une douleur vive. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : sans l’aide de la main. Plus difficile : tenez 30 à 40 secondes.$q$,
  updated_at = now()
where name in ($q$Étirement élévateur scapula$q$, $q$Étirement de l’élévateur de la scapula$q$);

update rehab_exercises set
  name = $q$Étirement du trapèze supérieur$q$,
  description = $q$Assis, tenez le bord de la chaise avec la main du côté à étirer. Inclinez doucement l’oreille vers l’épaule opposée, sans tourner la tête. Vous sentez l’étirement sur le côté du cou. Tenez 20 à 30 secondes en respirant calmement.$q$,
  progression_regression = $q$Plus facile : 10 à 15 secondes, sans tenir la chaise. Plus difficile : répétez 2 à 3 fois.$q$,
  updated_at = now()
where name in ($q$Étirement trapèze supérieur$q$, $q$Étirement du trapèze supérieur$q$);

update rehab_exercises set
  description = $q$Assis droit, mains croisées derrière la tête. Poussez doucement la tête vers l’arrière contre les mains, sans que la tête bouge. Tenez 5 à 10 secondes à effort modéré, puis relâchez lentement.$q$,
  progression_regression = $q$Plus facile : effort très doux, 3 à 5 secondes. Plus difficile : tenez plus longtemps.$q$,
  updated_at = now()
where name = $q$Isométrie extension cervicale$q$;

update rehab_exercises set
  description = $q$Assis droit, une main sur le front. Poussez doucement le front contre la main, sans que la tête bouge. Tenez 5 à 10 secondes à effort modéré, puis relâchez lentement.$q$,
  progression_regression = $q$Plus facile : effort très doux, 3 à 5 secondes. Plus difficile : 2 séries, maintien plus long.$q$,
  updated_at = now()
where name = $q$Isométrie flexion cervicale$q$;

update rehab_exercises set
  name = $q$Isométrie inclinaison latérale cervicale$q$,
  description = $q$Assis droit, une main posée contre la tempe. Poussez la tête vers la main comme pour pencher l’oreille vers l’épaule, sans que la tête bouge. Tenez 5 à 10 secondes, puis faites l’autre côté.$q$,
  progression_regression = $q$Plus facile : effort très doux. Plus difficile : 2 à 3 séries.$q$,
  updated_at = now()
where name in ($q$Isométrie inclinaison latérale$q$, $q$Isométrie inclinaison latérale cervicale$q$);

update rehab_exercises set
  description = $q$Assis droit, faites lentement de petits « oui » (hocher la tête), puis de petits « non » (tourner la tête), puis de petits « peut-être » (pencher l’oreille vers l’épaule). Restez dans une amplitude confortable, sans forcer en fin de mouvement.$q$,
  progression_regression = $q$Plus facile : un seul cycle, petite amplitude. Plus difficile : deux cycles, en agrandissant progressivement.$q$,
  updated_at = now()
where name = $q$Mobilité oui-non-peut-être$q$;

update rehab_exercises set
  description = $q$Assis droit, épaules immobiles. Tournez lentement la tête pour regarder par-dessus une épaule, revenez au centre, puis de l’autre côté. Allez jusqu’où c’est confortable et augmentez l’amplitude d’une séance à l’autre.$q$,
  progression_regression = $q$Plus facile : plus petit et plus lent. Plus difficile : amplitude plus grande, le regard guidant le mouvement.$q$,
  updated_at = now()
where name = $q$Rotation cervicale contrôlée$q$;

update rehab_exercises set
  description = $q$Assis droit, un doigt posé sur le menton. Rentrez le menton en reculant la tête contre la légère résistance du doigt. Tenez 5 à 10 secondes, sans pencher la tête vers le bas.$q$,
  progression_regression = $q$Plus facile : sans résistance. Plus difficile : maintien plus long, résistance un peu plus forte.$q$,
  updated_at = now()
where name = $q$Chin tuck avec résistance légère$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, sans oreiller. Rentrez le menton, puis soulevez la tête de 2 à 3 cm en gardant le menton rentré. Tenez 5 à 10 secondes, puis reposez doucement. Le menton ne part pas vers le plafond.$q$,
  progression_regression = $q$Plus facile : rentrez le menton sans soulever la tête. Plus difficile : tenez plus longtemps.$q$,
  updated_at = now()
where name = $q$Flexion cervicale progressive couché$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, genoux pliés, une serviette roulée sous la nuque. Hochez très légèrement la tête comme pour dire « oui », en écrasant doucement la serviette, sans contracter l’avant du cou. Tenez 10 secondes, relâchez. Le mouvement est très petit et précis.$q$,
  progression_regression = $q$Plus facile : tenez 3 à 5 secondes. Plus difficile : 10 répétitions de 10 secondes.$q$,
  updated_at = now()
where name = $q$Renfo fléchisseurs profonds$q$;

update rehab_exercises set
  description = $q$Assis, jambe tendue ou pied dans le vide. Dessinez les lettres de l’alphabet avec le gros orteil, en faisant bouger la cheville et non le genou. Faites des lettres larges et lentes.$q$,
  progression_regression = $q$Plus facile : la moitié de l’alphabet. Plus difficile : deux alphabets.$q$,
  updated_at = now()
where name = $q$Alphabet du pied (cheville)$q$;

update rehab_exercises set
  description = $q$Debout, pieds écartés de la largeur du bassin, mains en appui léger sur un mur. Montez sur la pointe des pieds le plus haut possible, puis redescendez lentement en 2 à 3 secondes. Gardez le poids sur le gros orteil, sans que les chevilles partent vers l’extérieur.$q$,
  progression_regression = $q$Plus facile : appui plus marqué sur le mur. Plus difficile : sur une seule jambe.$q$,
  updated_at = now()
where name = $q$Élévations mollets bilatérales$q$;

update rehab_exercises set
  name = $q$Équilibre unipodal$q$,
  description = $q$Debout près d’un appui (mur, plan de travail), tenez-vous sur une jambe, genou légèrement fléchi. Restez stable 20 à 40 secondes, puis changez de jambe. Le bassin reste horizontal.$q$,
  progression_regression = $q$Plus facile : un doigt sur l’appui. Plus difficile : yeux fermés, ou en tournant la tête.$q$,
  updated_at = now()
where name in ($q$Equilibre unipodal$q$, $q$Équilibre unipodal$q$);

update rehab_exercises set
  description = $q$Face à un mur, mains contre le mur, une jambe en arrière. Gardez la jambe arrière tendue, talon au sol et pied droit, puis avancez le bassin vers le mur. Vous sentez l’étirement dans le mollet. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : 10 à 15 secondes, pas plus petit. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name = $q$Étirement mollet genou tendu$q$;

update rehab_exercises set
  description = $q$Face à un mur, mains contre le mur, une jambe en arrière. Pliez les deux genoux en gardant le talon arrière au sol. Vous sentez l’étirement bas dans le mollet, près du talon. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : amplitude douce. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name = $q$Étirement soléaire genou fléchi$q$;

update rehab_exercises set
  description = $q$Debout, mains en appui sur un mur. Montez à mi-hauteur sur la pointe des pieds et restez immobile. Tenez 30 à 45 secondes avec un effort soutenu mais supportable, puis redescendez doucement. Une douleur modérée au tendon est acceptable si elle est revenue à la normale le lendemain matin.$q$,
  progression_regression = $q$Plus facile : assis, en poussant les pointes dans le sol. Plus difficile : sur une seule jambe.$q$,
  updated_at = now()
where name = $q$Isométrie mollet debout$q$;

update rehab_exercises set
  description = $q$Marchez sur la pointe des pieds, talons hauts, sur 10 à 20 mètres. Restez grand et faites des petits pas réguliers.$q$,
  progression_regression = $q$Plus facile : distance plus courte. Plus difficile : distance plus longue.$q$,
  updated_at = now()
where name = $q$Marches sur pointes$q$;

update rehab_exercises set
  description = $q$Marchez sur les talons, pointes des pieds relevées, sur 10 à 20 mètres. Gardez le buste droit et des petits pas.$q$,
  progression_regression = $q$Plus facile : 5 à 10 pas. Plus difficile : distance plus longue.$q$,
  updated_at = now()
where name = $q$Marches sur talons$q$;

update rehab_exercises set
  description = $q$Face à un mur, pied à environ 10 cm du mur. Avancez le genou pour toucher le mur sans décoller le talon, puis revenez. Le genou passe dans l’axe du deuxième orteil.$q$,
  progression_regression = $q$Plus facile : pied plus près du mur. Plus difficile : reculez le pied progressivement.$q$,
  updated_at = now()
where name = $q$Mobilité dorsiflexion au mur$q$;

update rehab_exercises set
  name = $q$Calf raise excentrique (bord d’escalier)$q$,
  description = $q$Debout sur une marche, avant des pieds sur le bord, talons dans le vide, une main sur la rampe. Montez sur les deux pointes, puis passez sur la jambe à travailler et descendez lentement le talon sous le niveau de la marche en 3 secondes. Remontez avec les deux jambes. Faites-le aussi genou légèrement plié.$q$,
  progression_regression = $q$Plus facile : descente sur les deux jambes, amplitude réduite. Plus difficile : sac à dos lesté.$q$,
  updated_at = now()
where name in ($q$Calf raise excentrique (bord d'escalier)$q$, $q$Calf raise excentrique (bord d’escalier)$q$);

update rehab_exercises set
  description = $q$Debout, mains en appui léger sur un mur. Montez sur la pointe des pieds en 3 secondes, puis redescendez en 3 secondes, sans à-coup. La charge est assez lourde pour que les dernières répétitions soient difficiles. Commencez sur deux jambes, puis passez sur une jambe.$q$,
  progression_regression = $q$Plus facile : sur deux jambes, amplitude partielle. Plus difficile : sac à dos lesté, alourdi chaque semaine.$q$,
  updated_at = now()
where name = $q$Calf raise lourd lent (HSR)$q$;

update rehab_exercises set
  description = $q$Debout sur une jambe, mains en appui sur un mur. Montez sur la pointe du pied le plus haut possible, puis redescendez lentement en 2 à 3 secondes. Gardez le poids sur le gros orteil, sans que la cheville parte vers l’extérieur.$q$,
  progression_regression = $q$Plus facile : sur deux jambes. Plus difficile : sur le bord d’une marche, talon dans le vide.$q$,
  updated_at = now()
where name = $q$Élévations mollets unilatérales$q$;

update rehab_exercises set
  name = $q$Équilibre unipodal sur coussin$q$,
  description = $q$Debout sur une jambe sur un coussin ou une serviette pliée, près d’un appui. Genou légèrement fléchi, gardez l’équilibre 20 à 40 secondes, puis changez de jambe.$q$,
  progression_regression = $q$Plus facile : sur sol dur. Plus difficile : bougez les bras ou lancez une balle contre un mur.$q$,
  updated_at = now()
where name in ($q$Equilibre unipodal surface molle$q$, $q$Équilibre unipodal sur coussin$q$);

update rehab_exercises set
  description = $q$Assis, jambe tendue, élastique autour de l’avant du pied et attaché du côté intérieur. Tournez la plante du pied vers l’extérieur contre l’élastique, puis revenez lentement. Seule la cheville bouge, pas la jambe.$q$,
  progression_regression = $q$Plus facile : sans élastique. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Éversion élastique$q$;

update rehab_exercises set
  description = $q$Assis, jambe tendue, élastique autour de l’avant du pied et attaché du côté extérieur. Tournez la plante du pied vers l’intérieur contre l’élastique, puis revenez lentement. Seule la cheville bouge, pas la jambe.$q$,
  progression_regression = $q$Plus facile : sans élastique. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Inversion élastique$q$;

update rehab_exercises set
  name = $q$Star Excursion : atteinte antérieure$q$,
  description = $q$Debout sur une jambe, genou légèrement fléchi. Allez toucher le sol le plus loin possible devant vous avec la pointe de l’autre pied, sans vous appuyer dessus, puis revenez en contrôle. Le genou d’appui reste dans l’axe du pied. Notez la distance atteinte pour suivre vos progrès.$q$,
  progression_regression = $q$Plus facile : moins loin, un doigt sur un appui. Plus difficile : sur un coussin, yeux fermés.$q$,
  updated_at = now()
where name in ($q$Star Excursion — atteinte antérieure$q$, $q$Star Excursion : atteinte antérieure$q$);

update rehab_exercises set
  name = $q$Star Excursion : atteinte postéro-médiale$q$,
  description = $q$Debout sur une jambe, genou légèrement fléchi. Allez toucher le sol le plus loin possible en diagonale, derrière vous et vers l’intérieur, avec la pointe de l’autre pied, puis revenez en contrôle. Le genou d’appui reste dans l’axe du pied.$q$,
  progression_regression = $q$Plus facile : moins loin, un doigt sur un appui. Plus difficile : yeux fermés.$q$,
  updated_at = now()
where name in ($q$Star Excursion — atteinte postéro-médiale$q$, $q$Star Excursion : atteinte postéro-médiale$q$);

update rehab_exercises set
  description = $q$Assis, bras le long du corps ou coude posé sur une table. Pliez et tendez lentement le coude sur toute l’amplitude confortable.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : petite charge (bouteille d’eau).$q$,
  updated_at = now()
where name = $q$Flexion/extension du coude contrôlée$q$;

update rehab_exercises set
  name = $q$Pronation et supination légères$q$,
  description = $q$Assis, coude plié à 90° contre le corps, avant-bras posé sur une table. Tenez un marteau ou une bouteille par le bas, puis tournez lentement la paume vers le plafond, puis vers le sol.$q$,
  progression_regression = $q$Plus facile : sans objet. Plus difficile : tenez l’objet plus loin de son extrémité.$q$,
  updated_at = now()
where name in ($q$Pronation/supination léger$q$, $q$Pronation et supination légères$q$);

update rehab_exercises set
  description = $q$Debout, bras le long du corps, pouces vers l’avant. Levez les bras sur le côté jusqu’à hauteur d’épaule, ou jusqu’où c’est confortable, puis redescendez en 3 secondes. Les épaules ne montent pas vers les oreilles.$q$,
  progression_regression = $q$Plus facile : sans charge, amplitude réduite. Plus difficile : petites bouteilles d’eau.$q$,
  updated_at = now()
where name = $q$Élévations latérales légères$q$;

update rehab_exercises set
  description = $q$Debout ou assis, amenez un bras tendu devant la poitrine. Avec l’autre main, tirez doucement le coude vers l’épaule opposée. Vous sentez l’étirement à l’arrière de l’épaule. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : traction légère. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name = $q$Étirement deltoïde postérieur$q$;

update rehab_exercises set
  name = $q$Étirement des pectoraux dans une porte$q$,
  description = $q$Dans l’encadrement d’une porte, avant-bras contre le montant, coude à hauteur d’épaule. Avancez doucement d’un pas pour ouvrir la poitrine. Vous sentez l’étirement devant l’épaule et sur la poitrine, sans fourmillement dans le bras. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : coude plus bas. Plus difficile : coude un peu plus haut.$q$,
  updated_at = now()
where name in ($q$Étirement pectoral porte$q$, $q$Étirement des pectoraux dans une porte$q$);

update rehab_exercises set
  description = $q$Penché en avant, la main valide en appui sur une table, laissez pendre le bras douloureux. Faites-le balancer doucement d’avant en arrière, puis en petits cercles, en le gardant complètement relâché : c’est le corps qui crée le mouvement.$q$,
  progression_regression = $q$Plus facile : balancements plus petits. Plus difficile : cercles plus grands.$q$,
  updated_at = now()
where name = $q$Pendulaire d’épaule$q$;

update rehab_exercises set
  description = $q$Debout face à un mur, mains à plat à hauteur d’épaules, un peu plus écartées que les épaules. Pliez les coudes pour approcher la poitrine du mur, puis repoussez. Le corps reste droit, des talons à la tête.$q$,
  progression_regression = $q$Plus facile : pieds plus près du mur. Plus difficile : mains sur un plan de travail, pieds plus loin.$q$,
  updated_at = now()
where name = $q$Pompes murales$q$;

update rehab_exercises set
  description = $q$Assis ou debout, bras le long du corps. Rapprochez doucement les omoplates vers l’arrière et vers le bas, comme pour les glisser dans les poches arrière. Tenez 5 secondes, puis relâchez. Les épaules ne montent pas.$q$,
  progression_regression = $q$Plus facile : sans tenir. Plus difficile : avec un élastique tiré des deux mains.$q$,
  updated_at = now()
where name = $q$Rétraction scapulaire$q$;

update rehab_exercises set
  description = $q$Allongé sur le côté non douloureux, une serviette roulée entre le coude et le corps, coude plié à 90°. Levez l’avant-bras vers le plafond en 3 secondes en gardant le coude contre la serviette, puis redescendez en 3 secondes.$q$,
  progression_regression = $q$Plus facile : amplitude partielle, sans charge. Plus difficile : petite charge de 0,5 à 2 kg.$q$,
  updated_at = now()
where name = $q$Rotation externe couché sur le côté$q$;

update rehab_exercises set
  description = $q$Debout ou assis, élastique accroché devant vous à hauteur de poitrine. Tirez les mains vers vous, coudes près du corps, en rapprochant les omoplates, puis revenez lentement. Le dos reste droit et les épaules basses.$q$,
  progression_regression = $q$Plus facile : amplitude réduite, élastique plus souple. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Row élastique$q$;

update rehab_exercises set
  description = $q$Allongé sur le ventre, front sur une serviette, bras écartés en T, pouces vers le plafond. Rapprochez les omoplates, soulevez les bras de quelques centimètres, tenez 2 secondes et redescendez. Le cou reste détendu.$q$,
  progression_regression = $q$Plus facile : sans charge. Plus difficile : petites bouteilles d’eau.$q$,
  updated_at = now()
where name = $q$Prone T avec charge légère$q$;

update rehab_exercises set
  description = $q$Allongé sur le ventre, front sur une serviette, bras tendus en Y au-dessus de la tête, pouces vers le plafond. Abaissez les omoplates, soulevez les bras de quelques centimètres, tenez 2 secondes et redescendez. Le cou reste détendu et le bas du dos ne se creuse pas.$q$,
  progression_regression = $q$Plus facile : sans charge, amplitude partielle. Plus difficile : petites bouteilles d’eau.$q$,
  updated_at = now()
where name = $q$Prone Y avec charge légère$q$;

update rehab_exercises set
  description = $q$Debout, coude plié à 90° contre le corps (une serviette roulée sous le bras aide), élastique tenu devant le ventre. Tournez l’avant-bras vers l’extérieur en gardant le coude contre le corps, puis revenez en 3 secondes.$q$,
  progression_regression = $q$Plus facile : sans mouvement, en poussant contre l’élastique. Plus difficile : bras écarté à 90° du corps.$q$,
  updated_at = now()
where name = $q$Rotation externe élastique$q$;

update rehab_exercises set
  description = $q$Debout, élastique attaché sur le côté, coude plié à 90° contre le corps. Ramenez l’avant-bras vers le ventre contre l’élastique, puis revenez lentement en 3 secondes. Le coude reste contre le corps.$q$,
  progression_regression = $q$Plus facile : amplitude partielle. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Rotation interne élastique$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, un bras tendu vers le plafond, une bouteille d’eau en main. Poussez la main vers le plafond en décollant l’omoplate du sol, sans plier le coude, puis redescendez doucement. Le mouvement est petit.$q$,
  progression_regression = $q$Plus facile : sans charge. Plus difficile : debout, en poussant contre un élastique.$q$,
  updated_at = now()
where name = $q$Serratus punch$q$;

update rehab_exercises set
  description = $q$Debout face au mur, avant-bras posés contre le mur, petits doigts vers le mur. Faites glisser les avant-bras vers le haut en écartant légèrement les omoplates, puis redescendez lentement. Restez dans une amplitude sans douleur.$q$,
  progression_regression = $q$Plus facile : demi-amplitude. Plus difficile : élastique autour des poignets.$q$,
  updated_at = now()
where name = $q$Wall slides$q$;

update rehab_exercises set
  description = $q$Allongé sur le ventre, ou debout penché en avant dos droit. Levez les bras successivement en forme de Y (au-dessus de la tête), de T (sur les côtés), puis de W (coudes pliés, ramenés vers les côtes), en rapprochant les omoplates. Tenez 2 secondes dans chaque lettre.$q$,
  progression_regression = $q$Plus facile : debout contre un mur. Plus difficile : buste plus incliné, petites charges.$q$,
  updated_at = now()
where name = $q$Y-T-W$q$;

update rehab_exercises set
  name = $q$Étirement des ischio-jambiers$q$,
  description = $q$Debout, talon posé sur une marche basse, jambe tendue. Penchez le buste en avant en gardant le dos droit, jusqu’à sentir l’étirement derrière la cuisse. Tenez 20 à 30 secondes, sans rebonds.$q$,
  progression_regression = $q$Plus facile : genou un peu fléchi. Plus difficile : support un peu plus haut.$q$,
  region = $q$Cuisse$q$,
  updated_at = now()
where name in ($q$Étirement ischios$q$, $q$Étirement des ischio-jambiers$q$);

update rehab_exercises set
  name = $q$Étirement du quadriceps$q$,
  description = $q$Debout en tenant un appui, attrapez la cheville et ramenez doucement le talon vers la fesse. Genoux côte à côte, bassin légèrement rentré. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : allongé sur le côté, ou avec une serviette autour de la cheville. Plus difficile : 30 à 40 secondes.$q$,
  region = $q$Cuisse$q$,
  updated_at = now()
where name in ($q$Étirement quadriceps$q$, $q$Étirement du quadriceps$q$);

update rehab_exercises set
  description = $q$Assis sur une chaise, genou plié à 90°. Poussez le talon dans le sol en le tirant vers vous, comme pour plier le genou, sans le bouger. Tenez 5 à 10 secondes, puis relâchez.$q$,
  progression_regression = $q$Plus facile : effort plus doux. Plus difficile : pont sur les talons, allongé.$q$,
  region = $q$Cuisse$q$,
  updated_at = now()
where name = $q$Isométrie ischios talon au sol$q$;

update rehab_exercises set
  description = $q$À genoux sur un coussin, chevilles bloquées sous un meuble lourd ou tenues par un partenaire. Gardez le corps droit des genoux à la tête et laissez-vous descendre vers l’avant le plus lentement possible. Rattrapez-vous avec les mains et remontez en poussant sur les bras.$q$,
  progression_regression = $q$Plus facile : descente partielle, ou aidée par un élastique fixé en hauteur. Plus difficile : descendez plus bas et plus lentement chaque semaine.$q$,
  region = $q$Cuisse$q$,
  updated_at = now()
where name = $q$Nordic hamstring curl$q$;

update rehab_exercises set
  description = $q$À genoux sur un coussin, corps droit des genoux aux épaules, bras croisés. Penchez-vous lentement en arrière en gardant les hanches tendues, sans cambrer, puis revenez. L’avant de la cuisse travaille.$q$,
  progression_regression = $q$Plus facile : amplitude partielle. Plus difficile : amplitude plus grande, mouvement plus lent.$q$,
  region = $q$Cuisse$q$,
  updated_at = now()
where name = $q$Reverse nordic curl$q$;

update rehab_exercises set
  description = $q$Assis sur une chaise, genou plié à environ 60°, cheville bloquée derrière un pied de table ou par une sangle. Poussez comme pour tendre le genou, sans bouger, avec un effort soutenu mais supportable. Tenez 30 à 45 secondes, puis relâchez doucement.$q$,
  progression_regression = $q$Plus facile : genou plié à 90°, durée plus courte. Plus difficile : effort plus important.$q$,
  updated_at = now()
where name = $q$Isométrie quadriceps 60° (chaise)$q$;

update rehab_exercises set
  name = $q$Contraction du quadriceps (quad sets)$q$,
  description = $q$Assis ou allongé, jambe tendue, une serviette roulée sous le genou. Écrasez la serviette en contractant le muscle de l’avant de la cuisse et tenez 5 à 10 secondes. La rotule remonte légèrement.$q$,
  progression_regression = $q$Plus facile : 5 secondes. Plus difficile : 10 secondes, pointe du pied tirée vers vous.$q$,
  updated_at = now()
where name in ($q$Quad sets$q$, $q$Contraction du quadriceps (quad sets)$q$);

update rehab_exercises set
  name = $q$Élévation de la jambe tendue$q$,
  description = $q$Allongé sur le dos, une jambe pliée, l’autre tendue. Contractez l’avant de la cuisse tendue puis levez-la jusqu’à la hauteur du genou plié. Redescendez lentement, sans que le genou se plie.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : petit poids à la cheville.$q$,
  updated_at = now()
where name in ($q$SLR jambe tendue$q$, $q$Élévation de la jambe tendue$q$);

update rehab_exercises set
  description = $q$Dos contre un mur, pieds à 30 cm du mur, écartés de la largeur du bassin. Glissez le long du mur en pliant un peu les genoux, puis remontez. Les genoux restent dans l’axe des pieds, sans rentrer vers l’intérieur.$q$,
  progression_regression = $q$Plus facile : descendez moins. Plus difficile : descendez plus bas, ou tenez la position.$q$,
  updated_at = now()
where name = $q$Squat partiel au mur$q$;

update rehab_exercises set
  description = $q$Debout sur une surface inclinée d’environ 25° (planche calée), talons en haut. Sur la jambe à travailler, descendez lentement en 3 secondes en pliant le genou jusqu’à 60 à 70°. Remontez en vous aidant de l’autre jambe. Une douleur modérée au tendon est acceptable si elle est revenue à la normale le lendemain matin.$q$,
  progression_regression = $q$Plus facile : sur deux jambes, inclinaison plus faible. Plus difficile : sac à dos lesté.$q$,
  updated_at = now()
where name = $q$Déclin squat excentrique (planche inclinée)$q$;

update rehab_exercises set
  description = $q$Assis au bord d’une chaise, pieds à plat. Levez-vous en 3 secondes sans l’aide des mains, puis rasseyez-vous en 3 secondes en freinant la descente. Les genoux restent dans l’axe des pieds.$q$,
  progression_regression = $q$Plus facile : chaise plus haute, aide des mains. Plus difficile : sur une jambe, avec une aide légère.$q$,
  updated_at = now()
where name = $q$Montées de chaise lentes$q$;

update rehab_exercises set
  name = $q$Squat sur une jambe contrôlé$q$,
  description = $q$Debout sur une jambe, près d’un appui. Pliez lentement le genou comme pour vous asseoir, genou au-dessus du deuxième orteil et bassin horizontal, puis remontez. Le genou ne rentre pas vers l’intérieur.$q$,
  progression_regression = $q$Plus facile : amplitude partielle, un doigt sur l’appui. Plus difficile : plus bas, ou sur un coussin.$q$,
  updated_at = now()
where name in ($q$Single leg squat contrôlé$q$, $q$Squat sur une jambe contrôlé$q$);

update rehab_exercises set
  description = $q$Passez une sangle ou un élastique épais autour d’un poteau solide et derrière les deux genoux. Reculez pour tendre la sangle, puis asseyez-vous en arrière, tibias verticaux, comme sur une chaise invisible. Tenez 30 à 45 secondes. La sangle charge l’avant de la cuisse en ménageant le genou.$q$,
  progression_regression = $q$Plus facile : descendez moins. Plus difficile : plus bas, ou plus longtemps.$q$,
  updated_at = now()
where name = $q$Spanish squat élastique$q$;

update rehab_exercises set
  description = $q$Debout sur une marche basse, sur une jambe. Descendez lentement le talon de l’autre jambe pour effleurer le sol, puis remontez. Le genou d’appui reste au-dessus du pied et le bassin horizontal.$q$,
  progression_regression = $q$Plus facile : marche plus basse, main sur la rampe. Plus difficile : marche plus haute.$q$,
  updated_at = now()
where name = $q$Step-down bas$q$;

update rehab_exercises set
  name = $q$Extension terminale du genou à l’élastique$q$,
  description = $q$Élastique fixé devant vous et passé derrière le genou. Debout, genou légèrement plié, tendez complètement le genou contre l’élastique en contractant la cuisse, tenez 2 secondes, puis relâchez doucement.$q$,
  progression_regression = $q$Plus facile : élastique plus souple. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name in ($q$TKE élastique$q$, $q$Extension terminale du genou à l’élastique$q$);

update rehab_exercises set
  description = $q$Marchez à une allure qui vous permet de parler, sur terrain plat. Commencez par une durée qui n’augmente pas vos douleurs dans les heures qui suivent, puis ajoutez quelques minutes chaque semaine. L’objectif est d’atteindre environ 30 minutes, 5 fois par semaine.$q$,
  progression_regression = $q$Plus facile : 5 à 10 minutes, en plusieurs fois. Plus difficile : durée plus longue, petites côtes.$q$,
  updated_at = now()
where name = $q$Marche confortable$q$;

update rehab_exercises set
  name = $q$Abduction de hanche couché sur le côté$q$,
  description = $q$Allongé sur le côté, jambe du dessous pliée, jambe du dessus tendue dans l’axe du corps. Levez la jambe du dessus de 20 à 30 cm, pointe du pied vers l’avant, puis redescendez lentement. Le bassin ne bascule pas vers l’arrière.$q$,
  progression_regression = $q$Plus facile : jambe du dessus pliée. Plus difficile : élastique autour des chevilles.$q$,
  updated_at = now()
where name in ($q$Abduction de hanche couché$q$, $q$Abduction de hanche couché sur le côté$q$);

update rehab_exercises set
  description = $q$Allongé sur le côté, hanches et genoux pliés, pieds joints. Ouvrez le genou du dessus en gardant les pieds collés, puis refermez lentement. Le bassin reste immobile, sans basculer en arrière.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : élastique autour des genoux.$q$,
  updated_at = now()
where name = $q$Clamshell$q$;

update rehab_exercises set
  name = $q$Étirement des fléchisseurs de hanche$q$,
  description = $q$À genoux sur un coussin, un pied devant. Rentrez légèrement le bassin, puis avancez-le doucement jusqu’à sentir l’étirement devant la hanche du genou au sol. Le dos ne se creuse pas. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : fente plus courte. Plus difficile : levez le bras du côté étiré.$q$,
  updated_at = now()
where name in ($q$Étirement fléchisseurs de hanche$q$, $q$Étirement des fléchisseurs de hanche$q$);

update rehab_exercises set
  name = $q$Étirement du piriforme$q$,
  description = $q$Allongé sur le dos, posez la cheville sur le genou opposé. Ramenez doucement la cuisse d’appui vers la poitrine jusqu’à sentir l’étirement dans la fesse. Tenez 20 à 30 secondes en respirant.$q$,
  progression_regression = $q$Plus facile : pied de la jambe d’appui au sol. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name in ($q$Étirement piriforme$q$, $q$Étirement du piriforme$q$);

update rehab_exercises set
  description = $q$Assis au sol, mains en appui derrière vous, genoux pliés, pieds au sol plus écartés que le bassin. Basculez lentement les deux genoux d’un côté vers le sol, puis de l’autre, sans forcer.$q$,
  progression_regression = $q$Plus facile : petite amplitude. Plus difficile : pause de 2 secondes de chaque côté.$q$,
  updated_at = now()
where name = $q$Mobilité hanches 90/90 assis$q$;

update rehab_exercises set
  description = $q$Debout sur une jambe en tenant un appui, élastique autour des chevilles. Écartez lentement l’autre jambe sur le côté, pied droit devant, puis revenez en contrôle. Le buste reste droit, sans se pencher.$q$,
  progression_regression = $q$Plus facile : sans élastique. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Abduction de hanche debout élastique$q$;

update rehab_exercises set
  description = $q$Allongé sur le côté, avant-bras au sol, genou de la jambe du dessus posé sur une chaise. Soulevez le bassin pour aligner le corps et tenez la position. C’est l’intérieur de la cuisse du dessus qui travaille. Faites les deux côtés.$q$,
  progression_regression = $q$Plus facile : tenez moins longtemps. Plus difficile : appui par la cheville (version longue).$q$,
  updated_at = now()
where name = $q$Copenhagen plank court (appui genou)$q$;

update rehab_exercises set
  description = $q$Assis au sol, haut du dos contre un canapé ou un banc, pieds à plat, une charge posée sur le bassin. Poussez le bassin vers le plafond en serrant les fesses jusqu’à aligner épaules, hanches et genoux, puis redescendez lentement. Le menton reste rentré.$q$,
  progression_regression = $q$Plus facile : sans charge (pont fessier). Plus difficile : charge plus lourde, ou sur une jambe.$q$,
  updated_at = now()
where name = $q$Hip thrust avec poids$q$;

update rehab_exercises set
  description = $q$Élastique autour des genoux ou des chevilles, genoux légèrement fléchis. Faites 5 à 10 pas de côté en gardant l’élastique tendu et les genoux dans l’axe des pieds, puis revenez.$q$,
  progression_regression = $q$Plus facile : élastique au-dessus des genoux. Plus difficile : élastique aux chevilles.$q$,
  updated_at = now()
where name = $q$Marche latérale élastique$q$;

update rehab_exercises set
  description = $q$Élastique autour des genoux ou des chevilles, genoux légèrement fléchis, pieds écartés. Avancez à petits pas en diagonale en gardant l’élastique tendu, puis reculez de la même façon.$q$,
  progression_regression = $q$Plus facile : pas plus courts. Plus difficile : élastique plus fort.$q$,
  updated_at = now()
where name = $q$Monster walk$q$;

update rehab_exercises set
  name = $q$Pont fessier sur une jambe$q$,
  description = $q$Allongé sur le dos, un genou plié pied au sol, l’autre jambe tendue. Poussez sur le talon pour lever le bassin jusqu’à aligner épaule, hanche et genou, puis redescendez lentement. Le bassin reste horizontal.$q$,
  progression_regression = $q$Plus facile : pont sur deux jambes. Plus difficile : montée et descente en 3 secondes.$q$,
  updated_at = now()
where name in ($q$Pont 1 jambe$q$, $q$Pont fessier sur une jambe$q$);

update rehab_exercises set
  name = $q$Soulevé de terre jambe tendue sur une jambe$q$,
  description = $q$Debout sur une jambe, genou légèrement fléchi. Penchez le buste en avant en reculant les fesses et en laissant l’autre jambe partir en arrière, dos droit, puis revenez. Le bassin reste face au sol.$q$,
  progression_regression = $q$Plus facile : un doigt sur un mur. Plus difficile : petite charge dans la main opposée.$q$,
  updated_at = now()
where name in ($q$RDL unilatéral sans charge$q$, $q$Soulevé de terre jambe tendue sur une jambe$q$);

update rehab_exercises set
  name = $q$Soulevé de terre jambes tendues léger$q$,
  description = $q$Debout, une charge légère dans chaque main (bouteilles d’eau), genoux légèrement fléchis. Penchez le buste en avant en reculant les fesses, dos droit, charges près des jambes, jusqu’à sentir l’arrière des cuisses. Remontez en poussant les hanches vers l’avant.$q$,
  progression_regression = $q$Plus facile : sans charge, au mur. Plus difficile : charge plus lourde, ou sur une jambe.$q$,
  updated_at = now()
where name in ($q$Romanian Deadlift bilatéral léger$q$, $q$Soulevé de terre jambes tendues léger$q$);

update rehab_exercises set
  description = $q$Allongé sur le côté, avant-bras au sol, cheville de la jambe du dessus posée sur une chaise, jambe tendue. Soulevez le bassin pour aligner le corps et tenez. L’intérieur de la cuisse du dessus travaille fortement. Faites les deux côtés.$q$,
  progression_regression = $q$Plus facile : version appui genou. Plus difficile : montez et descendez la jambe du dessous.$q$,
  updated_at = now()
where name = $q$Copenhagen plank long (appui cheville)$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, genoux pliés, pieds à plat. Poussez sur les talons pour lever le bassin jusqu’à aligner épaules, hanches et genoux, en serrant les fesses. Redescendez lentement.$q$,
  progression_regression = $q$Plus facile : petite amplitude. Plus difficile : sur une jambe.$q$,
  region = $q$Hanche$q$,
  updated_at = now()
where name = $q$Pont fessier$q$;

update rehab_exercises set
  name = $q$Montée de marche basse$q$,
  description = $q$Face à une marche basse. Montez en poussant sur le talon de la jambe posée sur la marche, sans vous aider de l’autre jambe, puis redescendez lentement. Le genou reste au-dessus du pied.$q$,
  progression_regression = $q$Plus facile : marche plus basse, main sur la rampe. Plus difficile : marche plus haute.$q$,
  updated_at = now()
where name in ($q$Step-up bas$q$, $q$Montée de marche basse$q$);

update rehab_exercises set
  description = $q$Debout, reculez un pied d’un grand pas et descendez doucement en pliant les deux genoux, buste droit. Remontez en poussant sur la jambe avant. Le genou avant reste au-dessus du pied.$q$,
  progression_regression = $q$Plus facile : descente partielle, appui sur une chaise. Plus difficile : descente plus profonde, charges dans les mains.$q$,
  updated_at = now()
where name = $q$Fente arrière courte$q$;

update rehab_exercises set
  name = $q$Fente bulgare$q$,
  description = $q$Dos à une chaise, posez le dessus du pied arrière sur l’assise. Descendez lentement le genou arrière vers le sol, buste droit et genou avant au-dessus du pied, puis remontez en poussant sur la jambe avant.$q$,
  progression_regression = $q$Plus facile : fente arrière classique. Plus difficile : charges dans les mains.$q$,
  updated_at = now()
where name in ($q$Bulgarian split squat$q$, $q$Fente bulgare$q$);

update rehab_exercises set
  description = $q$Allongé sur le dos genoux pliés, ou assis. Basculez doucement le bassin pour creuser légèrement le bas du dos, puis pour le plaquer au sol. Mouvement lent et sans forcer, en respirant.$q$,
  progression_regression = $q$Plus facile : amplitude minime. Plus difficile : debout, dos contre un mur.$q$,
  updated_at = now()
where name = $q$Bascules du bassin$q$;

update rehab_exercises set
  name = $q$Dos rond, dos creux (cat-camel)$q$,
  description = $q$À quatre pattes, mains sous les épaules, genoux sous les hanches. Arrondissez lentement tout le dos en rentrant le menton, puis creusez-le doucement en regardant devant vous. Restez dans une amplitude confortable.$q$,
  progression_regression = $q$Plus facile : 5 à 6 répétitions, petite amplitude. Plus difficile : 10 à 12 répétitions.$q$,
  updated_at = now()
where name in ($q$Cat-camel$q$, $q$Dos rond, dos creux (cat-camel)$q$);

update rehab_exercises set
  name = $q$Étirement latéral du tronc$q$,
  description = $q$Debout, pieds écartés. Levez un bras au-dessus de la tête et penchez doucement le buste du côté opposé, sans tourner. Vous sentez l’étirement sur le flanc. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : amplitude douce. Plus difficile : jambe du côté étiré croisée derrière l’autre.$q$,
  updated_at = now()
where name in ($q$Étirement QL$q$, $q$Étirement latéral du tronc$q$);

update rehab_exercises set
  description = $q$Debout, pieds écartés, mains dans le creux des reins. Penchez-vous lentement en arrière autant que possible, puis revenez, 10 fois de suite. Si la douleur se rapproche du centre du dos, c’est bon signe ; si elle descend dans la jambe, arrêtez.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : allez un peu plus loin à chaque répétition.$q$,
  updated_at = now()
where name = $q$Extension debout répétée$q$;

update rehab_exercises set
  name = $q$Flexion lombaire répétée couché$q$,
  description = $q$Allongé sur le dos, ramenez les deux genoux vers la poitrine avec les mains, tenez 2 secondes, puis relâchez, 10 fois de suite. Arrêtez si la douleur descend dans la jambe.$q$,
  progression_regression = $q$Plus facile : un genou à la fois. Plus difficile : tirez un peu plus sur les genoux en fin de mouvement.$q$,
  updated_at = now()
where name in ($q$Flexion lombaire répétée en décubitus$q$, $q$Flexion lombaire répétée couché$q$);

update rehab_exercises set
  description = $q$Allongé sur le dos, genoux pliés. Ramenez un genou vers la poitrine avec les mains, tenez quelques secondes, reposez-le, puis faites l’autre.$q$,
  progression_regression = $q$Plus facile : tenez moins longtemps. Plus difficile : 2 séries.$q$,
  updated_at = now()
where name = $q$Genoux-poitrine alternés$q$;

update rehab_exercises set
  description = $q$Allongé sur le ventre, mains sous les épaules. Tendez les bras pour soulever le buste en laissant le bassin et les jambes relâchés au sol, puis redescendez. Expirez en montant. Arrêtez si la douleur descend dans la jambe.$q$,
  progression_regression = $q$Plus facile : en appui sur les avant-bras (sphinx). Plus difficile : bras complètement tendus, 2 secondes en haut.$q$,
  updated_at = now()
where name = $q$Press-up lombaire (McKenzie extension)$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, jambes posées sur une chaise, hanches et genoux à 90°. Relâchez le dos et respirez lentement par le ventre pendant 1 à 3 minutes. Position de repos utile quand le dos est douloureux.$q$,
  progression_regression = $q$Plus facile : 1 minute. Plus difficile : 5 minutes.$q$,
  updated_at = now()
where name = $q$Relaxation 90/90$q$;

update rehab_exercises set
  description = $q$À quatre pattes, dos plat. Tendez lentement un bras devant et la jambe opposée derrière, à l’horizontale, tenez 3 secondes, puis revenez et changez de côté. Le dos ne bouge pas : imaginez un verre d’eau posé dessus.$q$,
  progression_regression = $q$Plus facile : un membre à la fois. Plus difficile : pause de 5 secondes.$q$,
  updated_at = now()
where name = $q$Bird-dog$q$;

update rehab_exercises set
  description = $q$Debout, pieds écartés de la largeur du bassin. Inspirez par le nez en gonflant le ventre et les flancs pendant que vous descendez lentement en squat, puis expirez en remontant, ventre tonique. Le mouvement reste fluide et sans douleur.$q$,
  progression_regression = $q$Plus facile : squat partiel. Plus difficile : charge légère tenue contre la poitrine.$q$,
  updated_at = now()
where name = $q$Breathing squat (respiration en charge)$q$;

update rehab_exercises set
  name = $q$Charnière de hanche au mur$q$,
  description = $q$Dos au mur, talons à 20 cm du mur, genoux légèrement fléchis. Reculez les fesses pour toucher le mur en penchant le buste en avant, dos droit, puis revenez debout en poussant les hanches vers l’avant. C’est le geste de base pour ramasser un objet sans arrondir le dos.$q$,
  progression_regression = $q$Plus facile : mains sur les cuisses. Plus difficile : éloignez-vous un peu du mur, charge légère.$q$,
  region = $q$Lombaires$q$,
  updated_at = now()
where name in ($q$Hip hinge au mur$q$, $q$Charnière de hanche au mur$q$);

update rehab_exercises set
  description = $q$Placez un élastique autour des doigts tendus, pouce compris. Écartez les doigts contre l’élastique, puis refermez lentement.$q$,
  progression_regression = $q$Plus facile : élastique plus souple. Plus difficile : élastique plus serré, ou deux élastiques.$q$,
  updated_at = now()
where name = $q$Élastique des doigts$q$;

update rehab_exercises set
  description = $q$Main devant vous, doigts tendus. Enchaînez lentement ces positions en tenant 3 secondes chacune : main ouverte, crochet (doigts pliés au bout), poing fermé, « table » (doigts tendus pliés à la base), poing droit (doigts pliés sans fermer le bout). Revenez main ouverte.$q$,
  progression_regression = $q$Plus facile : plus lentement, moins de cycles. Plus difficile : 2 séries.$q$,
  updated_at = now()
where name = $q$Glissements tendineux main$q$;

update rehab_exercises set
  description = $q$Touchez le bout de chaque doigt avec le bout du pouce, de l’index à l’auriculaire, en formant un rond, puis revenez.$q$,
  progression_regression = $q$Plus facile : moins de cycles. Plus difficile : plus de cycles, puis glissez le pouce vers la base de l’auriculaire.$q$,
  updated_at = now()
where name = $q$Opposition du pouce$q$;

update rehab_exercises set
  description = $q$Pincez une pâte souple ou une pince à linge entre le pouce et l’index, en formant un rond. Tenez 3 secondes, puis relâchez.$q$,
  progression_regression = $q$Plus facile : maintien plus court. Plus difficile : pâte plus ferme.$q$,
  updated_at = now()
where name = $q$Pince pouce-index$q$;

update rehab_exercises set
  description = $q$Serrez une balle en mousse dans la main pendant 3 secondes, puis relâchez complètement. Répétez 10 à 20 fois.$q$,
  progression_regression = $q$Plus facile : moins de répétitions. Plus difficile : balle plus ferme.$q$,
  updated_at = now()
where name = $q$Prise de balle souple$q$;

update rehab_exercises set
  name = $q$Nerf cutané latéral de la cuisse : glissement$q$,
  description = $q$Debout en tenant un appui. Décalez doucement le bassin du côté opposé à la gêne en laissant la jambe gênante légèrement en arrière, puis revenez. Les sensations doivent rester légères et disparaître dès le retour.$q$,
  progression_regression = $q$Plus facile : amplitude minimale. Plus difficile : plus de répétitions.$q$,
  nerve_target = $q$Cutané latéral de la cuisse$q$,
  updated_at = now()
where name in ($q$Nerf cutané latéral cuisse – glissement$q$, $q$Nerf cutané latéral de la cuisse : glissement$q$);

update rehab_exercises set
  name = $q$Nerf fémoral : slider couché sur le côté$q$,
  description = $q$Allongé sur le côté non gênant, tête sur un coussin. Ramenez doucement le talon de la jambe du dessus vers la fesse, puis relâchez, la hanche restant alignée avec le buste. Mouvements lents ; les sensations dans la cuisse restent légères et disparaissent dès le relâchement.$q$,
  progression_regression = $q$Plus facile : mouvement plus court. Plus difficile : amplitude plus grande.$q$,
  nerve_target = $q$Fémoral$q$,
  updated_at = now()
where name in ($q$Nerf fémoral – slider latéral$q$, $q$Nerf fémoral : slider couché sur le côté$q$);

update rehab_exercises set
  name = $q$Nerf fibulaire : slider$q$,
  description = $q$Assis au bord d’une chaise, genou fléchi. Alternez lentement : pied tiré vers vous et tourné vers l’extérieur, puis pointe tendue vers le bas et tournée vers l’intérieur. Les sensations restent légères et disparaissent dès le relâchement.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : genou plus tendu.$q$,
  nerve_target = $q$Fibulaire$q$,
  updated_at = now()
where name in ($q$Nerf fibulaire – slider$q$, $q$Nerf fibulaire : slider$q$);

update rehab_exercises set
  name = $q$Nerf tibial : slider$q$,
  description = $q$Assis au bord d’une chaise, genou fléchi. Alternez lentement : pied tiré vers vous et tourné vers l’extérieur, puis pied tendu vers le bas. Les sensations restent légères et disparaissent dès le relâchement.$q$,
  progression_regression = $q$Plus facile : genou plus fléchi. Plus difficile : genou plus tendu.$q$,
  nerve_target = $q$Tibial$q$,
  updated_at = now()
where name in ($q$Nerf tibial – slider$q$, $q$Nerf tibial : slider$q$);

update rehab_exercises set
  name = $q$Nerf sciatique : slider allongé$q$,
  description = $q$Allongé sur le dos, tenez la cuisse derrière le genou, hanche pliée à 90°. Tendez le genou en reposant la tête au sol, puis pliez le genou en soulevant légèrement la tête, menton rentré. Mouvement lent : les sensations dans la jambe restent légères et disparaissent aussitôt.$q$,
  progression_regression = $q$Plus facile : genou moins tendu. Plus difficile : hanche plus pliée.$q$,
  nerve_target = $q$Sciatique$q$,
  updated_at = now()
where name in ($q$Sciatique – slider allongé$q$, $q$Nerf sciatique : slider allongé$q$);

update rehab_exercises set
  name = $q$Nerf fémoral : slider sur le ventre$q$,
  description = $q$Allongé sur le ventre, un coussin sous le bassin. Pliez lentement le genou pour amener le talon vers la fesse, puis relâchez, sans cambrer le bas du dos. Arrêtez avant toute douleur dans l’avant de la cuisse.$q$,
  progression_regression = $q$Plus facile : coussin plus épais sous le bassin. Plus difficile : sans coussin.$q$,
  nerve_target = $q$Fémoral$q$,
  updated_at = now()
where name in ($q$Nerf fémoral – slider ventral$q$, $q$Nerf fémoral : slider sur le ventre$q$);

update rehab_exercises set
  name = $q$Nerf sciatique : slider assis (slump)$q$,
  description = $q$Assis au bord d’une chaise, dos légèrement arrondi, mains derrière le dos. Tendez le genou en relevant la tête pour regarder le plafond, puis pliez le genou en baissant la tête. Mouvements lents et fluides, sans douleur.$q$,
  progression_regression = $q$Plus facile : dos plus droit. Plus difficile : pied tiré vers vous en fin d’extension.$q$,
  nerve_target = $q$Sciatique$q$,
  updated_at = now()
where name in ($q$Sciatique – slider slump assis$q$, $q$Nerf sciatique : slider assis (slump)$q$);

update rehab_exercises set
  name = $q$Nerf sciatique : tensioner assis$q$,
  description = $q$Assis au bord d’une chaise, dos légèrement arrondi. Tendez le genou et baissez légèrement la tête en même temps, puis relâchez les deux. Une légère tension derrière la jambe est normale ; elle disparaît dès que vous relâchez.$q$,
  progression_regression = $q$Plus facile : revenez au slider. Plus difficile : pause de 1 seconde en fin de mouvement.$q$,
  nerve_target = $q$Sciatique$q$,
  updated_at = now()
where name in ($q$Sciatique – tensioner léger assis$q$, $q$Nerf sciatique : tensioner assis$q$);

update rehab_exercises set
  name = $q$Nerf médian : slider$q$,
  description = $q$Debout, bras écarté sur le côté, coude plié, paume vers le plafond. Tendez le coude et ramenez le poignet vers l’arrière en penchant la tête du même côté que le bras, puis pliez le coude en redressant la tête. Mouvements lents, sans fourmillement qui persiste.$q$,
  progression_regression = $q$Plus facile : bras plus bas. Plus difficile : plus de répétitions.$q$,
  nerve_target = $q$Médian$q$,
  updated_at = now()
where name in ($q$Glissement nerf médian – slider$q$, $q$Nerf médian : slider$q$);

update rehab_exercises set
  name = $q$Nerf radial : slider$q$,
  description = $q$Debout, bras le long du corps, épaule basse. Tendez le coude en tournant la paume vers l’arrière et en pliant le poignet, tout en penchant la tête du même côté, puis revenez. Mouvements lents, sans douleur.$q$,
  progression_regression = $q$Plus facile : poignet neutre. Plus difficile : bras un peu plus en arrière.$q$,
  nerve_target = $q$Radial$q$,
  updated_at = now()
where name in ($q$Glissement nerf radial – slider$q$, $q$Nerf radial : slider$q$);

update rehab_exercises set
  name = $q$Nerf ulnaire : slider bras ouvert$q$,
  description = $q$Bras écarté sur le côté à hauteur d’épaule, coude plié à 90°, paume vers l’avant. Ramenez le poignet vers l’arrière, doigts vers le plafond, en penchant la tête du même côté, puis relâchez le poignet en redressant la tête. Mouvements lents, sans fourmillement qui persiste.$q$,
  progression_regression = $q$Plus facile : bras plus bas. Plus difficile : bras plus haut.$q$,
  nerve_target = $q$Ulnaire$q$,
  updated_at = now()
where name in ($q$Nerf ulnaire – slider bras ouvert$q$, $q$Nerf ulnaire : slider bras ouvert$q$);

update rehab_exercises set
  name = $q$Nerf ulnaire : lunettes tête droite$q$,
  description = $q$Formez un rond avec le pouce et l’index, autres doigts tendus. Retournez la main et amenez ce rond devant l’œil comme des lunettes, doigts vers la mâchoire, coude levé, tête droite. Revenez lentement. Une légère tension au bord interne de l’avant-bras est normale et disparaît au retour.$q$,
  progression_regression = $q$Plus facile : amplitude moindre. Plus difficile : plus de répétitions.$q$,
  nerve_target = $q$Ulnaire$q$,
  updated_at = now()
where name in ($q$Tensionner léger nerf ulnaire – lunettes$q$, $q$Nerf ulnaire : lunettes tête droite$q$);

update rehab_exercises set
  name = $q$Nerf ulnaire : tensioner lunettes$q$,
  description = $q$Formez un rond avec le pouce et l’index, autres doigts tendus. Retournez la main et amenez ce rond devant l’œil comme des lunettes, coude levé, en penchant la tête du côté opposé. Revenez lentement. La tension doit disparaître dès le retour.$q$,
  progression_regression = $q$Plus facile : tête droite. Plus difficile : pause de 1 seconde.$q$,
  nerve_target = $q$Ulnaire$q$,
  updated_at = now()
where name in ($q$Nerf ulnaire – tensioner Lunettes$q$, $q$Nerf ulnaire : tensioner lunettes$q$);

update rehab_exercises set
  name = $q$Nerf médian : tensioner$q$,
  description = $q$Debout, bras écarté sur le côté, coude plié, paume vers le plafond. Tendez le coude et ramenez le poignet vers l’arrière en penchant la tête du côté opposé, puis revenez. Une légère tension est normale ; elle disparaît dès le retour.$q$,
  progression_regression = $q$Plus facile : revenez au slider. Plus difficile : petite pause en fin de mouvement.$q$,
  nerve_target = $q$Médian$q$,
  updated_at = now()
where name in ($q$Nerf médian – tensioner léger$q$, $q$Nerf médian : tensioner$q$);

update rehab_exercises set
  name = $q$Nerf radial : tensioner$q$,
  description = $q$Debout, bras le long du corps, épaule basse. Tendez le coude en tournant la paume vers l’arrière et en pliant le poignet, tout en penchant la tête du côté opposé, puis revenez. La tension doit disparaître dès le retour.$q$,
  progression_regression = $q$Plus facile : revenez au slider. Plus difficile : amplitude plus grande.$q$,
  nerve_target = $q$Radial$q$,
  updated_at = now()
where name in ($q$Nerf radial – tensioner léger$q$, $q$Nerf radial : tensioner$q$);

update rehab_exercises set
  description = $q$Assis, pieds à plat au sol. Écartez tous les orteils le plus possible, tenez 2 secondes, puis relâchez. Répétez 5 à 10 fois.$q$,
  progression_regression = $q$Plus facile : moins de répétitions. Plus difficile : élastique autour des orteils, ou debout.$q$,
  updated_at = now()
where name = $q$Écartement des orteils$q$;

update rehab_exercises set
  description = $q$Assis, pied à plat sur une serviette posée au sol. Ramenez la serviette vers vous en la froissant avec les orteils, le talon restant au sol.$q$,
  progression_regression = $q$Plus facile : petite serviette. Plus difficile : poids posé au bout de la serviette.$q$,
  updated_at = now()
where name = $q$Ramassage de serviette$q$;

update rehab_exercises set
  name = $q$Balle sous la voûte plantaire$q$,
  description = $q$Assis, faites rouler une balle sous la plante du pied, du talon aux orteils, pendant 1 à 2 minutes, avec une pression confortable.$q$,
  progression_regression = $q$Plus facile : balle plus souple, moins longtemps. Plus difficile : debout, un peu plus d’appui.$q$,
  updated_at = now()
where name in ($q$Rouleau voûte plantaire$q$, $q$Balle sous la voûte plantaire$q$);

update rehab_exercises set
  name = $q$Pied court (short foot)$q$,
  description = $q$Assis, pied à plat. Rapprochez la base du gros orteil du talon pour creuser la voûte, sans recroqueviller les orteils. Tenez 5 secondes, puis relâchez.$q$,
  progression_regression = $q$Plus facile : assis. Plus difficile : debout, puis sur une jambe.$q$,
  updated_at = now()
where name in ($q$Short foot$q$, $q$Pied court (short foot)$q$);

update rehab_exercises set
  description = $q$Assis, pieds à plat. Levez le gros orteil en gardant les autres au sol, puis inversez : gros orteil au sol, autres orteils levés. Alternez lentement.$q$,
  progression_regression = $q$Plus facile : aidez-vous de la main. Plus difficile : debout.$q$,
  updated_at = now()
where name = $q$Toe yoga$q$;

update rehab_exercises set
  name = $q$Étirement des extenseurs du poignet$q$,
  description = $q$Bras tendu devant vous, paume vers le sol. Avec l’autre main, pliez doucement le poignet vers le bas jusqu’à sentir l’étirement sur le dessus de l’avant-bras. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : 10 à 15 secondes, coude plié. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name in ($q$Étirement extenseurs poignet$q$, $q$Étirement des extenseurs du poignet$q$);

update rehab_exercises set
  name = $q$Étirement des fléchisseurs du poignet$q$,
  description = $q$Bras tendu devant vous, paume vers le plafond. Avec l’autre main, tirez doucement les doigts vers le bas jusqu’à sentir l’étirement sous l’avant-bras. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : traction légère, coude plié. Plus difficile : 30 à 40 secondes.$q$,
  updated_at = now()
where name in ($q$Étirement fléchisseurs poignet$q$, $q$Étirement des fléchisseurs du poignet$q$);

update rehab_exercises set
  name = $q$Isométrie des extenseurs du poignet$q$,
  description = $q$Avant-bras posé sur une table, paume vers le bas, main dans le vide. Relevez la main contre la résistance de l’autre main, sans que le poignet bouge. Tenez 30 à 45 secondes à effort modéré. Une douleur légère au coude est acceptable.$q$,
  progression_regression = $q$Plus facile : effort plus doux, 10 secondes. Plus difficile : effort plus fort.$q$,
  updated_at = now()
where name in ($q$Isométrie extenseurs poignet$q$, $q$Isométrie des extenseurs du poignet$q$);

update rehab_exercises set
  name = $q$Renforcement des extenseurs du poignet$q$,
  description = $q$Avant-bras posé sur une table, paume vers le bas, main dans le vide, petit poids en main. Relevez le poignet, puis redescendez lentement en 3 secondes.$q$,
  progression_regression = $q$Plus facile : sans poids. Plus difficile : poids un peu plus lourd.$q$,
  updated_at = now()
where name in ($q$Renfo extenseurs poignet$q$, $q$Renforcement des extenseurs du poignet$q$);

update rehab_exercises set
  name = $q$Renforcement des fléchisseurs du poignet$q$,
  description = $q$Avant-bras posé sur une table, paume vers le plafond, main dans le vide, petit poids en main. Pliez le poignet vers vous, puis redescendez lentement en 3 secondes.$q$,
  progression_regression = $q$Plus facile : sans poids. Plus difficile : poids un peu plus lourd.$q$,
  updated_at = now()
where name in ($q$Renfo fléchisseurs poignet$q$, $q$Renforcement des fléchisseurs du poignet$q$);

update rehab_exercises set
  name = $q$Excentrique lent des extenseurs du poignet$q$,
  description = $q$Avant-bras posé sur une table, paume vers le bas, poids en main. Relevez la main avec l’aide de l’autre main, puis redescendez-la seule, lentement, en 3 secondes. Une douleur modérée au coude est acceptable si elle est revenue à la normale le lendemain matin.$q$,
  progression_regression = $q$Plus facile : sans poids, amplitude réduite. Plus difficile : poids de 0,5 à 1 kg, puis plus.$q$,
  updated_at = now()
where name in ($q$Excentrique extenseurs poignet lent$q$, $q$Excentrique lent des extenseurs du poignet$q$);

update rehab_exercises set
  name = $q$Étirement des pectoraux au mur$q$,
  description = $q$De côté contre un mur, avant-bras posé sur le mur, coude à hauteur d’épaule. Tournez doucement le buste à l’opposé du mur jusqu’à sentir l’étirement sur la poitrine. Tenez 20 à 30 secondes.$q$,
  progression_regression = $q$Plus facile : bras plus bas. Plus difficile : bras plus haut.$q$,
  updated_at = now()
where name in ($q$Étirement pectoraux au mur$q$, $q$Étirement des pectoraux au mur$q$);

update rehab_exercises set
  description = $q$Assis sur une chaise à dossier bas, mains croisées sur la poitrine. Penchez doucement le haut du dos en arrière par-dessus le dossier, puis revenez. Le bas du dos reste en appui.$q$,
  progression_regression = $q$Plus facile : mains sur la poitrine. Plus difficile : mains derrière la tête.$q$,
  updated_at = now()
where name = $q$Extension thoracique sur chaise$q$;

update rehab_exercises set
  name = $q$Ouverture thoracique couché (open book)$q$,
  description = $q$Allongé sur le côté, genoux pliés à 90°, bras tendus devant vous l’un sur l’autre. Ouvrez le bras du dessus en arc de cercle vers l’arrière en suivant la main du regard, puis revenez. Les genoux restent l’un sur l’autre.$q$,
  progression_regression = $q$Plus facile : amplitude réduite. Plus difficile : pause de 2 secondes en ouverture, en expirant.$q$,
  updated_at = now()
where name in ($q$Open book$q$, $q$Ouverture thoracique couché (open book)$q$);

update rehab_exercises set
  description = $q$Assis ou allongé, mains posées sur les côtes. Inspirez par le nez en écartant les côtes contre les mains, puis expirez lentement par la bouche. Les épaules restent relâchées.$q$,
  progression_regression = $q$Plus facile : 5 respirations. Plus difficile : 1 à 2 minutes.$q$,
  updated_at = now()
where name = $q$Respiration costale$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, genoux pliés, une main sur le ventre, l’autre sur les côtes. Inspirez par le nez en 4 secondes en gonflant le ventre, les flancs et le bas du dos, puis expirez lentement en 6 secondes. Les épaules ne montent pas.$q$,
  progression_regression = $q$Plus facile : moins de respirations. Plus difficile : assis, debout, puis pendant un effort.$q$,
  updated_at = now()
where name = $q$Respiration diaphragmatique 360°$q$;

update rehab_exercises set
  description = $q$Assis au bord d’une chaise, bras croisés sur la poitrine, bassin immobile. Tournez lentement le buste d’un côté puis de l’autre, en suivant avec le regard.$q$,
  progression_regression = $q$Plus facile : mains sur les cuisses, petite amplitude. Plus difficile : amplitude plus grande.$q$,
  updated_at = now()
where name = $q$Rotation thoracique assise$q$;

update rehab_exercises set
  description = $q$Allongé sur le dos, un rouleau en mousse sous le milieu du dos, mains derrière la tête, fesses au sol. Laissez le haut du dos s’étendre par-dessus le rouleau en expirant, puis revenez. Déplacez le rouleau de quelques centimètres et recommencez.$q$,
  progression_regression = $q$Plus facile : serviette roulée. Plus difficile : rouleau placé plus haut.$q$,
  updated_at = now()
where name = $q$Extension thoracique sur rouleau$q$;

update rehab_exercises set
  name = $q$Tirage élastique assis$q$,
  description = $q$Assis, élastique accroché devant vous. Tirez les coudes vers l’arrière en rapprochant les omoplates, poitrine ouverte, puis revenez lentement.$q$,
  progression_regression = $q$Plus facile : amplitude courte. Plus difficile : élastique plus fort.$q$,
  region = $q$Thoraciques$q$,
  updated_at = now()
where name in ($q$Row élastique léger (thorax)$q$, $q$Tirage élastique assis$q$);

update rehab_exercises set
  name = $q$Anges au mur (wall angels)$q$,
  description = $q$Dos au mur, pieds à 15 cm du mur, bas du dos proche du mur. Bras en chandelier contre le mur, faites glisser les bras vers le haut puis redescendez, en gardant si possible les avant-bras au contact du mur.$q$,
  progression_regression = $q$Plus facile : demi-amplitude. Plus difficile : plus lent, pause en haut.$q$,
  region = $q$Thoraciques$q$,
  updated_at = now()
where name in ($q$Wall angels$q$, $q$Anges au mur (wall angels)$q$);

insert into rehab_exercises (name, region, type, level, description, progression_regression, nerve_target, is_active) values
  ($q$Élévation de talon lourde, serviette sous les orteils$q$, $q$Pied$q$, $q$renfo$q$, 2, $q$Debout sur une marche, une serviette roulée sous les orteils du pied à travailler, talon dans le vide, mains sur la rampe. Montez sur la pointe en 3 secondes, tenez 2 secondes en haut, puis redescendez en 3 secondes. Ajoutez un sac à dos chargé dès que 12 répétitions deviennent faciles.$q$, $q$Plus facile : sur deux jambes, sans serviette. Plus difficile : sac à dos plus lourd, jusqu’à 8 répétitions difficiles.$q$, NULL, true),
  ($q$Isométrie d’abduction de hanche sur le dos$q$, $q$Hanche$q$, $q$renfo$q$, 1, $q$Allongé sur le dos, genoux pliés, une ceinture serrée autour des cuisses juste au-dessus des genoux. Écartez les genoux contre la ceinture, sans bouger, à effort modéré, et tenez 30 à 45 secondes. Cette position ne comprime pas le côté de la hanche.$q$, $q$Plus facile : effort plus doux, durée plus courte. Plus difficile : pont fessier en écartant contre la ceinture.$q$, NULL, true),
  ($q$Squat lourd lent (HSR)$q$, $q$Genou$q$, $q$renfo$q$, 2, $q$Debout, pieds écartés de la largeur du bassin, sac à dos chargé ou charges dans les mains. Descendez en 3 secondes jusqu’à environ 90° de flexion de genou, puis remontez en 3 secondes. La charge rend les dernières répétitions difficiles. Une douleur sous la rotule est acceptable jusqu’à 5 sur 10 si elle est revenue à la normale le lendemain matin.$q$, $q$Plus facile : amplitude partielle, sans charge. Plus difficile : charge augmentée chaque semaine, puis fente bulgare lourde.$q$, NULL, true),
  ($q$Isométrie rotation externe d’épaule$q$, $q$Épaule$q$, $q$renfo$q$, 1, $q$Debout de côté contre l’encadrement d’une porte, coude plié à 90° contre le corps, dos de la main contre le montant. Poussez la main vers l’extérieur contre le montant, sans bouger, à effort modéré. Tenez 30 à 45 secondes, puis relâchez doucement.$q$, $q$Plus facile : effort plus doux. Plus difficile : rotation externe à l’élastique.$q$, NULL, true),
  ($q$Glissement du bras sur une table$q$, $q$Épaule$q$, $q$mobilité$q$, 1, $q$Assis de côté à une table, avant-bras posé sur un torchon. Faites glisser le bras vers l’avant en penchant le buste, jusqu’à une tension supportable, tenez 10 à 20 secondes, puis revenez. La tension diminue dans les minutes qui suivent.$q$, $q$Plus facile : glissement plus court. Plus difficile : glissement vers le haut contre un mur.$q$, NULL, true),
  ($q$Rotation externe assistée au bâton$q$, $q$Épaule$q$, $q$mobilité$q$, 1, $q$Allongé sur le dos, coudes pliés à 90° contre le corps, un bâton tenu dans les deux mains. Avec le bras valide, poussez doucement l’avant-bras du côté raide vers l’extérieur jusqu’à une tension supportable, tenez 10 à 20 secondes, puis revenez.$q$, $q$Plus facile : amplitude réduite, serviette sous le coude. Plus difficile : bras écarté de 45° du corps.$q$, NULL, true),
  ($q$Extender (protocole Askling)$q$, $q$Cuisse$q$, $q$mobilité$q$, 2, $q$Allongé sur le dos, tenez la cuisse à deux mains, hanche pliée à 90°. Tendez lentement le genou jusqu’à une tension supportable derrière la cuisse, sans douleur, puis repliez. Mouvement actif et contrôlé.$q$, $q$Plus facile : amplitude réduite. Plus difficile : mouvement plus rapide quand il est indolore.$q$, NULL, true),
  ($q$Diver (protocole Askling)$q$, $q$Cuisse$q$, $q$renfo$q$, 2, $q$Debout sur la jambe blessée, genou légèrement plié. Penchez le buste en avant en tendant les bras devant vous et en levant l’autre jambe en arrière, comme un plongeon, puis revenez. Le genou d’appui garde la même flexion. Restez sans douleur.$q$, $q$Plus facile : amplitude réduite, appui léger. Plus difficile : plus d’amplitude et de vitesse.$q$, NULL, true),
  ($q$Glider (protocole Askling)$q$, $q$Cuisse$q$, $q$renfo$q$, 2, $q$Debout, la jambe blessée devant, genou légèrement plié, les mains sur un appui. Faites glisser l’autre pied vers l’arrière sur une serviette posée sur un sol lisse, puis revenez en vous aidant des bras plutôt que de la jambe arrière. Restez sans douleur.$q$, $q$Plus facile : glissement plus court. Plus difficile : glissement plus long et plus rapide.$q$, NULL, true),
  ($q$Ouverture contrôlée de la mâchoire$q$, $q$ATM$q$, $q$mobilité$q$, 1, $q$Assis droit, bout de la langue posé au palais derrière les dents du haut. Ouvrez lentement la bouche en gardant la langue au palais, sans que la mâchoire dévie sur le côté, puis refermez. Un miroir aide à contrôler la trajectoire.$q$, $q$Plus facile : petite ouverture. Plus difficile : guidez avec un doigt sur le menton pour garder la ligne.$q$, NULL, true),
  ($q$Stabilisation de la mâchoire$q$, $q$ATM$q$, $q$renfo$q$, 1, $q$Bouche entrouverte, langue au palais. Avec la main, poussez doucement le menton vers la gauche, vers la droite, puis vers le haut, en résistant sans que la mâchoire bouge. Tenez 5 secondes dans chaque direction, effort très léger.$q$, $q$Plus facile : effort encore plus léger. Plus difficile : 6 secondes, 6 fois par jour.$q$, NULL, true),
  ($q$Repositionnement cervical sur cible$q$, $q$Cervicales$q$, $q$proprio$q$, 1, $q$Assis à 90 cm d’un mur, regardez une cible à hauteur des yeux. Fermez les yeux, tournez la tête d’un côté, revenez au centre, puis ouvrez les yeux pour vérifier si vous êtes sur la cible. Corrigez et recommencez. Une lampe frontale rend l’exercice plus précis.$q$, $q$Plus facile : yeux ouverts, petite rotation. Plus difficile : debout, ou en suivant un tracé au mur.$q$, NULL, true),
  ($q$Stabilisation du regard$q$, $q$Cervicales$q$, $q$proprio$q$, 1, $q$Assis, fixez une lettre tenue à bout de bras. Tournez lentement la tête de droite à gauche en gardant la lettre nette, pendant 30 secondes, puis recommencez avec des « oui ». Un léger vertige passager est acceptable ; arrêtez s’il persiste.$q$, $q$Plus facile : mouvement plus lent et plus petit. Plus difficile : plus rapide, debout, fond chargé derrière la lettre.$q$, NULL, true),
  ($q$Marche en tandem$q$, $q$Global$q$, $q$proprio$q$, 1, $q$Le long d’un plan de travail ou d’un couloir, marchez en posant le talon juste devant les orteils de l’autre pied, comme sur une ligne. Faites 10 pas, retournez-vous et recommencez, une main toujours près de l’appui.$q$, $q$Plus facile : pieds légèrement décalés, main sur l’appui. Plus difficile : sans appui, en tournant la tête.$q$, NULL, true),
  ($q$Contraction du plancher pelvien$q$, $q$Bassin$q$, $q$renfo$q$, 1, $q$Assis ou allongé, respirez calmement. Serrez et remontez les muscles du périnée comme pour retenir un gaz et une envie d’uriner, sans serrer les fesses ni bloquer la respiration. Tenez 5 à 10 secondes, relâchez complètement le même temps, puis terminez par quelques contractions rapides.$q$, $q$Plus facile : 3 secondes, allongé. Plus difficile : 10 secondes, debout, puis au moment de tousser.$q$, NULL, true),
  ($q$Ouverture du pouce contre élastique$q$, $q$Main$q$, $q$renfo$q$, 1, $q$Main à plat sur la table, un élastique autour du pouce et de l’index. Écartez le pouce contre l’élastique en gardant sa base bien arrondie, sans creuser l’articulation, puis revenez lentement.$q$, $q$Plus facile : élastique plus souple. Plus difficile : élastique plus fort.$q$, NULL, true)
on conflict (name) do update set
  description = excluded.description,
  progression_regression = excluded.progression_regression,
  updated_at = now();

-- Garde-fou : chaque exercice actif a bien été relu.
do $$
declare non_relus int;
begin
  select count(*) into non_relus from rehab_exercises where is_active and updated_at <> now();
  if non_relus > 0 then
    raise exception 'Exercices actifs non relus : %', non_relus;
  end if;
end $$;

commit;
