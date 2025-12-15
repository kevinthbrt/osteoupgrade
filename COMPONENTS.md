# 📚 Guide des Composants UI - OsteoUpgrade

Ce guide documente les nouveaux composants UI standardisés créés pour améliorer la cohérence et l'ergonomie de l'application.

## 🎨 Système de Design

### Couleur Primaire
La couleur primaire a été unifiée à **Sky-500** (`#0ea5e9`) pour assurer une cohérence visuelle dans toute l'application.

```tsx
// Utilisez "primary" dans vos classes Tailwind
className="bg-primary text-white"
className="text-primary"
className="border-primary"
```

---

## 📦 Composants Disponibles

Tous les composants sont exportés depuis `@/components/ui` :

```tsx
import { Button, Card, Breadcrumbs, Spinner, Skeleton } from '@/components/ui'
```

---

## 🔘 Button

Bouton standardisé avec variantes et états de chargement.

### Variantes
- `primary` - Bouton principal (fond bleu sky)
- `secondary` - Bouton secondaire (fond gris)
- `danger` - Action destructive (fond rouge)
- `ghost` - Transparent avec hover
- `outline` - Bordure sans fond

### Tailles
- `sm` - Petit (px-3 py-1.5)
- `md` - Moyen (px-4 py-2) - **par défaut**
- `lg` - Grand (px-6 py-3)

### Props
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  className?: string
  // + tous les props HTMLButtonElement
}
```

### Exemples

```tsx
// Bouton primaire basique
<Button onClick={handleClick}>
  Enregistrer
</Button>

// Bouton avec état de chargement
<Button loading={isLoading}>
  Connexion
</Button>

// Bouton danger avec icône
<Button variant="danger" size="sm">
  <Trash className="h-4 w-4" />
  Supprimer
</Button>

// Bouton pleine largeur
<Button fullWidth variant="secondary">
  Annuler
</Button>

// Ghost button avec style custom
<Button variant="ghost" className="text-red-500">
  Fermer
</Button>
```

---

## 🗂️ Card

Système de cartes modulaire avec header, content et footer.

### Composants
- `Card` - Conteneur principal
- `CardHeader` - En-tête avec bordure inférieure
- `CardContent` - Contenu principal
- `CardFooter` - Pied de carte avec fond gris clair

### Variantes de Card
- `default` - Carte blanche avec bordure légère
- `gradient` - Fond dégradé subtil
- `outline` - Bordure épaisse, fond transparent
- `elevated` - Ombre prononcée

### Props

```tsx
interface CardProps {
  variant?: 'default' | 'gradient' | 'outline' | 'elevated'
  hoverable?: boolean  // Effet hover avec scale
  className?: string
}
```

### Exemples

```tsx
// Carte simple
<Card>
  <CardHeader>
    <h3 className="font-bold text-lg">Titre de la carte</h3>
  </CardHeader>
  <CardContent>
    <p>Contenu de la carte...</p>
  </CardContent>
</Card>

// Carte avec footer et effet hover
<Card variant="elevated" hoverable>
  <CardHeader>
    <div className="flex items-center gap-2">
      <User className="h-5 w-5" />
      <h3 className="font-bold">Profil utilisateur</h3>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-slate-600">
      Informations sur l'utilisateur...
    </p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Modifier</Button>
  </CardFooter>
</Card>

// Carte avec gradient
<Card variant="gradient">
  <CardContent>
    <div className="flex items-center gap-4">
      <Trophy className="h-8 w-8 text-amber-500" />
      <div>
        <h4 className="font-bold">Niveau 5</h4>
        <p className="text-sm text-slate-600">2500 XP</p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🧭 Breadcrumbs

Fil d'Ariane pour la navigation hiérarchique.

### Props

```tsx
interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean  // Affiche "Accueil" au début (true par défaut)
  className?: string
}
```

### Exemples

```tsx
// Breadcrumbs simple
<Breadcrumbs
  items={[
    { label: 'Modules', href: '/dashboard' },
    { label: 'Testing 3D', href: '/testing' },
    { label: 'Session #123' }
  ]}
/>

// Sans "Accueil"
<Breadcrumbs
  items={[
    { label: 'Dashboard', icon: <Home className="h-4 w-4" /> }
  ]}
  showHome={false}
/>

// Avec icônes personnalisées
<Breadcrumbs
  items={[
    { label: 'Admin', href: '/admin', icon: <Shield className="h-4 w-4" /> },
    { label: 'Utilisateurs', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Jean Dupont' }
  ]}
/>
```

---

## ⏳ Spinner

Indicateur de chargement animé.

### Composants
- `Spinner` - Spinner basique avec texte optionnel
- `PageSpinner` - Spinner centré pour pages complètes

### Props

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}
```

### Exemples

```tsx
// Spinner simple
<Spinner />

// Spinner avec texte
<Spinner size="lg" text="Chargement des données..." />

// Page de chargement
<PageSpinner text="Initialisation..." />

// Dans un bouton (déjà intégré dans Button)
<Button loading={isLoading}>
  Enregistrer
</Button>
```

---

## 💀 Skeleton

États de chargement squelette pour un meilleur UX.

### Composants
- `Skeleton` - Élément squelette basique
- `SkeletonText` - Lignes de texte squelette
- `SkeletonCard` - Carte squelette
- `SkeletonTable` - Tableau squelette
- `SkeletonGrid` - Grille de cartes squelette

### Exemples

```tsx
// Skeleton simple
<Skeleton className="h-10 w-full" />

// Texte multi-lignes
<SkeletonText lines={4} />

// Carte de chargement
<SkeletonCard />

// Grille de cartes
<SkeletonGrid items={6} columns={3} />

// Tableau
<SkeletonTable rows={10} columns={5} />

// Custom skeleton
<div className="space-y-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

## 🎯 Bonnes Pratiques

### 1. Consistance des Couleurs
```tsx
// ✅ BON - Utilise la couleur primary
<Button variant="primary">Valider</Button>

// ❌ ÉVITER - Couleurs hardcodées
<button className="bg-blue-500">Valider</button>
```

### 2. Hiérarchie Visuelle
```tsx
// ✅ BON - Boutons avec hiérarchie claire
<div className="flex gap-2">
  <Button variant="primary">Enregistrer</Button>
  <Button variant="secondary">Annuler</Button>
</div>

// ❌ ÉVITER - Tous les boutons primary
<div className="flex gap-2">
  <Button variant="primary">Enregistrer</Button>
  <Button variant="primary">Annuler</Button>
</div>
```

### 3. États de Chargement
```tsx
// ✅ BON - Skeleton pendant le chargement initial
{loading ? <SkeletonCard /> : <Card>{data}</Card>}

// ✅ BON - Spinner pour actions utilisateur
<Button loading={isSaving}>Enregistrer</Button>

// ❌ ÉVITER - Pas d'indication de chargement
{loading ? null : <Card>{data}</Card>}
```

### 4. Navigation
```tsx
// ✅ BON - Breadcrumbs sur toutes les pages profondes
<Breadcrumbs
  items={[
    { label: 'Admin', href: '/admin' },
    { label: 'Utilisateurs', href: '/admin/users' },
    { label: user.name }
  ]}
/>

// ✅ BON - Dernier élément sans lien (page actuelle)
```

### 5. Accessibilité
```tsx
// ✅ BON - Bouton avec aria-label pour icônes seules
<Button variant="ghost" aria-label="Fermer">
  <X className="h-4 w-4" />
</Button>

// ✅ BON - Texte de chargement descriptif
<PageSpinner text="Chargement de vos données médicales..." />
```

---

## 🚀 Migration des Pages Existantes

### Checklist de migration

Pour migrer une page existante vers les nouveaux composants :

1. **Importer les composants**
```tsx
import { Button, Card, Breadcrumbs, PageSpinner } from '@/components/ui'
```

2. **Remplacer les boutons**
```tsx
// Avant
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
  Cliquer
</button>

// Après
<Button>Cliquer</Button>
```

3. **Remplacer les spinners de chargement**
```tsx
// Avant
{loading && <div className="animate-spin h-8 w-8 border-2..." />}

// Après
{loading && <PageSpinner />}
```

4. **Ajouter des breadcrumbs**
```tsx
// En haut de la page
<Breadcrumbs items={[...]} />
```

5. **Utiliser des Cards pour les sections**
```tsx
// Avant
<div className="bg-white rounded-lg p-6 shadow">
  <h3>Titre</h3>
  <p>Contenu</p>
</div>

// Après
<Card>
  <CardHeader>
    <h3 className="font-bold">Titre</h3>
  </CardHeader>
  <CardContent>
    <p>Contenu</p>
  </CardContent>
</Card>
```

6. **Ajouter des skeletons pour le chargement**
```tsx
// Avant
{loading ? <div>Chargement...</div> : <DataTable />}

// Après
{loading ? <SkeletonTable rows={10} columns={4} /> : <DataTable />}
```

---

## 📝 Notes de Version

### Phase 1 (Actuelle)
- ✅ Couleur primaire unifiée (sky-500)
- ✅ Component Button avec variantes
- ✅ Component Card modulaire
- ✅ Component Breadcrumbs
- ✅ Components de loading (Spinner, Skeleton)
- ✅ Documentation complète

### Phase 2 (À venir)
- Input components standardisés
- Modal/Dialog unifié
- Toast notifications
- Système typographique documenté
- Dark mode complet

---

## 🆘 Support

Pour toute question ou suggestion d'amélioration des composants, contactez l'équipe de développement.

**Fichiers sources** : `/components/ui/`
**Exports** : `/components/ui/index.ts`
