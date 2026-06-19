# OsteoUpgrade — App mobile (Expo)

App mobile iOS/Android construite avec [Expo](https://expo.dev) (SDK 56) et
Expo Router, partageant le backend Supabase de l'app web OsteoUpgrade.

## Démarrage rapide (test en temps réel)

1. Installe les dépendances :

   ```bash
   cd mobile
   npm install
   ```

2. Lance le serveur de dev :

   ```bash
   npx expo start
   ```

3. Sur ton téléphone, installe **Expo Go** (App Store / Play Store), puis
   scanne le QR code affiché dans le terminal. L'app se charge en quelques
   secondes et se recharge automatiquement à chaque modification du code.

   Sur Mac avec Xcode : `npx expo start --ios` (simulateur iOS).

## Configuration

La connexion Supabase est lue depuis `.env` :

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

La clé `anon` est publique (protégée par les politiques RLS) et peut être
versionnée. Voir `.env.example`.

## Structure

```
src/
  app/                  # routes (Expo Router, file-based comme Next.js)
    _layout.tsx         # layout racine + garde d'authentification
    login.tsx           # écran de connexion
    (tabs)/             # navigation par onglets
      index.tsx         # Cours (formations e-learning, données réelles)
      flashcards.tsx    # Flashcards (à construire)
      pratique.tsx      # Pratique / vidéos techniques (à construire)
      profil.tsx        # Profil + déconnexion
  lib/
    supabase.ts         # client Supabase (persistance session AsyncStorage)
    auth.tsx            # AuthProvider + useAuth
    database.types.ts   # types des tables (alignés sur l'app web)
```

## État actuel

- [x] Authentification Supabase (email / mot de passe)
- [x] Écran Cours connecté aux vraies formations (`elearning_formations`)
- [ ] Détail formation → chapitres → sous-parties (vidéos Vimeo + PDF)
- [ ] Flashcards (répétition espacée)
- [ ] Pratique (vidéos par région)
- [ ] Suivi de progression
