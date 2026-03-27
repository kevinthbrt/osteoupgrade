# Encyclopédie — pipeline anti-coût tokens

Le module encyclopédie stocke actuellement du HTML complet (`content_html`). Cela pousse naturellement à demander au LLM :
- le fond médical,
- **et** toute la forme (hero, CSS, classes, sections, tableaux, callouts).

C’est ce second point qui consomme énormément de tokens.

## Solution recommandée (déjà prête dans ce repo)

Utiliser un **template HTML unique** et demander à l’IA uniquement un **fragment de contenu**.

### Fichiers ajoutés

- `scripts/encyclopedia/entry-template.html` : squelette visuel réutilisable (head + style + hero + wrapper).
- `scripts/encyclopedia/build-entry-html.mjs` : script qui injecte un fragment dans le template.

## Nouveau workflow

1. Tu donnes à l’IA ton cours manuscrit.
2. Tu demandes uniquement :
   - un fragment HTML sémantique (sections, h2/h3, paragraphes, tableaux),
   - sans `<html>`, `<head>`, `<style>`, hero global.
3. Tu sauvegardes ce fragment dans un fichier (ex: `tmp/chapitre2-fragment.html`).
4. Tu génères le HTML final :

```bash
node scripts/encyclopedia/build-entry-html.mjs \
  --input=tmp/chapitre2-fragment.html \
  --output=tmp/chapitre2-final.html \
  --title="Douleurs référées somatiques cervicales" \
  --eyebrow="Sémiologie cervicale · Chapitre 2" \
  --subtitle="Physiopathologie, convergence et patterns segmentaires" \
  --tags="Douleur référée,Convergence spinale,Facettes cervicales"
```

5. Tu colles `tmp/chapitre2-final.html` dans `content_html`.

## Gains attendus

- **Énorme baisse des tokens** côté génération (souvent 60–85% selon longueur du cours).
- Style homogène entre chapitres.
- Maintenance design centralisée (1 template à modifier).

## Prompt conseillé pour l’IA (copier-coller)

```text
Convertis le texte suivant en FRAGMENT HTML sémantique uniquement.
Contraintes strictes :
- Interdit : <!DOCTYPE>, <html>, <head>, <style>, <body>, hero global.
- Autorisé : <section>, <h2>, <h3>, <p>, <ul>, <ol>, <table>, <strong>, <em>, <div class="callout">.
- Rendu clair, structuré, pédagogique.
- N’invente pas de chiffres ni de références.
- Retourne uniquement le fragment HTML final.
```

## Étape suivante (si tu veux aller encore plus loin)

Passer à un stockage `content_markdown` ou JSON structuré en base, puis rendu côté app.
Cela permettrait de réduire encore les coûts et de faciliter la relecture/édition.
