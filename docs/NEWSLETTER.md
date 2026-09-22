# Newsletter : rédiger et envoyer

**Administration → Newsletter** (`/admin/mailing`) ne sert qu'à une chose :
écrire la newsletter du mois et l'envoyer. Aucune connaissance du HTML n'est
nécessaire, et il n'y a rien d'autre à comprendre sur cette page.

## Ce qui a changé, et pourquoi

L'ancienne page mélangeait quatre métiers : un éditeur HTML brut, une
bibliothèque de gabarits, le panneau des automatisations et l'envoi. Quelqu'un
qui voulait simplement écrire un message devait d'abord choisir un gabarit,
puis basculer entre « mode visuel » et « mode HTML », et se tromper d'un
`<div>` suffisait à casser la mise en page dans Outlook.

La page ne propose donc plus que des blocs. Le gabarit maison (bandeau dégradé
violet, corps blanc, encarts lavande, bouton dégradé, pied de page gris) n'est
plus un choix : il est appliqué automatiquement à chaque envoi.

Les gabarits (`mail_templates`) et les séquences (`mail_automations`) n'ont pas
disparu : ils alimentent toujours les emails déclenchés par les événements, et
se pilotent depuis **Administration → Automatisations**. Ils ne sont simplement
plus visibles ici.

## Écrire

La colonne de gauche est la palette. On fait glisser un bloc sur la page, ou on
clique dessus pour l'ajouter à la fin. Chaque bloc se déplace ensuite par sa
poignée, ou par les flèches qui apparaissent au survol : le glisser-déposer ne
fonctionne ni au clavier ni sur un écran tactile, il fallait donc que les deux
chemins existent.

| Bloc | À quoi il sert |
|---|---|
| Titre | Un titre de section, en violet |
| Texte | Un paragraphe. Gras, italique, souligné, lien, liste à puces |
| Image | Une illustration, avec légende, lien au clic et largeur réglable |
| Bouton | Un bouton violet vers une adresse |
| Encart | Le bloc lavande, pour mettre une idée en avant |
| Citation | Un témoignage, avec son auteur |
| Séparateur | Un trait fin |
| Espace | De l'air entre deux blocs |

Dans un bloc texte, un retour à la ligne reste un retour à la ligne ; deux
créent un nouveau paragraphe. Le collage arrive volontairement en texte brut :
c'est ce qui évite qu'un copier-coller depuis Word importe ses polices.

Le bandeau du haut (emoji, titre, sous-titre) et le pied de page s'écrivent
directement sur la page, mais leur forme ne change pas. La signature
« L'équipe OsteoUpgrade × MyOsteoflow » et le lien de désinscription sont
ajoutés automatiquement : il ne faut pas les écrire dans un bloc.

## Les images

Une illustration est déposée sur Vercel Blob
(`/api/admin/newsletter-image-upload`) et référencée par son URL publique. Ni
pièce jointe `cid:`, ni base64 : les campagnes Resend n'acceptent pas les
premières, et les secondes font grossir le message au point que Gmail le
tronque.

## Appeler chaque lecteur par son prénom

Les étiquettes du bloc violet insèrent une **balise Resend**, à trois accolades,
résolue par Resend au moment de l'envoi :

| Étiquette | Balise réellement insérée |
|---|---|
| Prénom | `{{{contact.first_name|cher confrère}}}` |
| Nom | `{{{contact.last_name}}}` |
| Email | `{{{contact.email}}}` |

Le texte après `|` est la valeur de repli quand l'information est inconnue.
Seules ces balises fonctionnent : les variables de l'ancienne page (`{{nom}}`,
`{{prix}}`…) appartiennent au moteur de séquences et ne sont pas résolues dans
une newsletter.

Elles ne sont pas résolues non plus par l'API transactionnelle. En envoi direct
et pour les tests, c'est donc `applyMergeTags` (`lib/newsletter.ts`) qui les
remplace avant l'envoi, sinon le destinataire lirait `{{{contact.first_name}}}`
en toutes lettres.

## Les listes de diffusion

| Liste | Qui elle contient |
|---|---|
| Tous les inscrits à la newsletter | Les comptes avec `newsletter_opt_in = true` |
| Une offre en particulier | `profiles.plan` (bundle, osteoflow, osteoupgrade, free), toujours avec l'opt-in |
| Contacts pré-lancement | `mail_contacts` en statut `newsletter_pre_launch` : des leads issus des funnels, sans compte |
| Adresses saisies à la main | Ce qu'on tape, pour écrire à quelques personnes |

Le nombre de destinataires est affiché avant l'envoi
(`/api/admin/newsletter-audience`) : c'est ce qui permet de voir qu'on
s'apprêtait à écrire à trois personnes plutôt qu'à deux mille.

## Les deux modes de diffusion

**Campagne (commercial)** : le choix normal pour une newsletter. Les contacts
sont synchronisés dans un segment Resend, puis une campagne
(*Broadcast*) est créée et envoyée. Quota marketing, distinct du quota
transactionnel, désinscription en un clic gérée par Resend, et balises de
personnalisation résolues destinataire par destinataire.

**Envoi direct (transactionnel)** : un message à la fois, par le même canal que
les emails de facture ou de bienvenue. Réservé aux petites listes, et limité à
200 destinataires par `MAX_DIRECT_RECIPIENTS`. À éviter pour une newsletter :
un abonné qui la signale comme indésirable abîme la réputation de l'adresse qui
envoie aussi les factures.

Les adresses saisies à la main partent toujours en direct : un test n'a pas à
créer un segment chez Resend.

## Brouillons et historique

Chaque newsletter est une ligne de la table `newsletters`. Le contenu est
enregistré une seconde et demie après la dernière frappe : on peut fermer
l'onglet au milieu d'un paragraphe et reprendre depuis une autre machine.

C'est `blocks` qui fait foi, pas un HTML stocké. Un correctif apporté au
gabarit dans `lib/newsletter.ts` s'applique donc aux brouillons déjà écrits.

Une newsletter envoyée passe en `status = 'sent'` et devient non modifiable :
son contenu est la trace de ce que les abonnés ont reçu. Pour repartir de là,
on la duplique, ce qui reprend aussi la liste et le mode de diffusion choisis.

## Où vit quoi

| Élément | Emplacement |
|---|---|
| Page | `app/admin/mailing/page.tsx` |
| Éditeur par blocs | `components/newsletter/NewsletterEditor.tsx` |
| Champ de texte enrichi | `components/newsletter/RichText.tsx` |
| Modèle, gabarit et rendu | `lib/newsletter.ts` |
| Brouillons | `app/api/admin/newsletters/` |
| Compte des destinataires | `app/api/admin/newsletter-audience/` |
| Images | `app/api/admin/newsletter-image-upload/` |
| Envoi | `app/api/mailing/send/route.ts` |
| Table | `supabase/migrations/20260922_newsletters.sql` |

## Deux garde-fous

Le HTML envoyé est **toujours** reconstruit sur le serveur à partir des blocs
stockés : ce que façonne le navigateur ne part jamais tel quel. Et le texte
enrichi est réécrit à chaque frappe dans un format volontairement pauvre
(`serializeEditable`), puis réassaini au rendu (`sanitizeInlineHtml`) : ni
`<script>`, ni attribut d'événement, ni adresse `javascript:` ne survivent aux
deux passes.
