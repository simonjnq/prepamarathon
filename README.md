# PrépaMarathon

MVP de coordination de soins et de suivi sportif pour la préparation marathon.
Étude de cas pour Via Sana.

Stack : Next.js 16 (App Router) · Tailwind 4 · Supabase (auth + Postgres).

---

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis remplir les clés Supabase
```

### 1. Charger le schéma dans Supabase

Une fois.

1. Ouvrir le projet Supabase → **SQL Editor** → **New query**.
2. Copier-coller le contenu de [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql).
3. Exécuter.

### 2. Seeder les comptes de démo

```bash
npm run seed
```

Crée 5 praticiens et 8 patients fictifs avec leurs parcours, RDV, notes, alertes, etc. Idempotent : peut être relancé.

Les identifiants sont listés dans [`DEMO_ACCOUNTS.md`](DEMO_ACCOUNTS.md). Tous utilisent le mot de passe `testprepamarathon`.

### 3. Lancer l'app

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Usage |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique côté navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin (seed uniquement, jamais exposée au client) |
| `DEMO_USER_PASSWORD` | Mot de passe partagé des comptes de démo |
| `DEMO_EMAIL_DOMAIN` | Domaine factice utilisé pour construire les emails (`prepa.test` par défaut) |

---

## Structure

```
src/
├── app/
│   ├── login/         # Page de connexion + server actions
│   ├── dashboard/     # Tableau de bord (vue praticien / vue patient)
│   └── page.tsx       # Redirection auth
├── lib/supabase/      # Clients Supabase (browser, server, proxy)
└── proxy.ts           # Refresh de session + redirection auth (équiv. middleware)

scripts/
├── seed-data.ts       # Données des praticiens et patients de démo
└── seed.ts            # Runner du seed

supabase/migrations/   # Schéma SQL initial
```

## Design system

Voir [`context.md`](context.md) pour la spec produit complète. Tokens dans [`src/app/globals.css`](src/app/globals.css).

- Fond crème `#F8F5F1`, accent corail `#E86F47`, texte noir doux `#242525`
- Police corps : Inter · Police accent : Cormorant Garamond italique
- Cartes blanches arrondies, ombres douces, design aéré

## Déploiement Vercel

Connecter le repo. Reporter dans Vercel les mêmes variables d'env. Les variables `NEXT_PUBLIC_*` sont nécessaires aussi en build, la `SUPABASE_SERVICE_ROLE_KEY` n'est utile que pour rejouer le seed.
