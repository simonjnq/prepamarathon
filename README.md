# PrépaMarathon — Via Sana

MVP de coordination de soins et de suivi sportif pour la préparation marathon. Étude de cas.

L'app connecte plusieurs praticiens (médecin du sport, kiné, ostéo, nutritionniste, podologue) et leurs patients autour d'un parcours sportif et médical jusqu'à la course. Au cœur du produit : la coordination, la centralisation des informations, les automatisations IA et la continuité du suivi.

**Stack** : Next.js 16 (App Router, Turbopack) · Tailwind 4 · Supabase (Auth + Postgres + Storage + Realtime) · Gemini 2.5 Flash (`@google/genai`).

---

## Démarrage rapide

```bash
npm install
cp .env.example .env.local
# remplir les clés Supabase + Gemini
```

### 1. Appliquer le schéma + toutes les migrations

Pas de Supabase CLI — on passe par le **SQL Editor** du dashboard Supabase. Coller dans l'ordre les 19 migrations de [`supabase/migrations/`](supabase/migrations/) :

| # | Rôle |
| --- | --- |
| 0001 | Schéma initial complet (tables, enums, RLS de base) |
| 0002 | Patients voient les profils des praticiens (annuaire) |
| 0003 | Patient peut signaler une alerte |
| 0004 | Patient peut éditer son questionnaire |
| 0005 | Praticiens peuvent écrire dans `journey_steps` et `assignments` |
| 0006 | Update `appointments`, `notes` (auteur), `assignments` |
| 0007 | Tables ajoutées à la publication realtime |
| 0008 | Table `reminders` (relances multicanales) |
| 0009 | Bucket Storage `documents` |
| 0010 | Discussion d'équipe `case_messages` + upload patient |
| 0011 | **RGPD strict** : helper `is_assigned_to()`, RLS verrouillée par assignment partout |
| 0012 | Owner-only writes (RDV par leur praticien, doc par uploader) |
| 0013 | Storage privé + signed URLs |
| 0014 | Audit trail `access_log` + RPC `log_access` |
| 0015 | Champs cliniques marathon (FCmax, VMA, ATCD chir, vacc) + populate seed |
| 0016 | Priorité sur les tâches (low/normal/high/urgent) |
| 0017 | Insert/update `pain_points` par praticien assigné |
| 0018 | Triggers auto : progress_pct, pain≥7→alerte, mots-clés→alerte |
| 0019 | Triggers événementiels : escalation patient, sync questionnaire, notif assignment |

### 2. Seeder les comptes de démo

```bash
npm run seed
```

Crée 5 praticiens et 8 patients fictifs avec parcours, RDV, notes, alertes, douleurs, documents, questionnaire — tout cohérent. **Idempotent** : supprime les comptes `@prepa.test` puis recrée.

⚠️ **Re-seeder écrase les données manuelles** créées via l'UI pendant la démo.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin (seed uniquement, jamais dans `src/`) |
| `DEMO_USER_PASSWORD` | Mot de passe partagé des comptes de démo |
| `DEMO_EMAIL_DOMAIN` | Domaine factice (`prepa.test` par défaut) |
| `GEMINI_API_KEY` | Optionnel — sans, l'IA bascule sur l'heuristique mots-clés |

---

## Fonctionnalités

### Côté praticien
- **Dashboard** : KPIs (patients suivis, alertes ouvertes, RDV jour) + Veille IA (Gemini priorise et recommande) + Surveillance temporelle (5 checks idempotents) + alertes prioritaires + RDV du jour
- **Liste patients** : filtrée aux assignés (RGPD strict), segmented control parcours, toggles "Avec alertes" et "Avec douleur active", tri par score de priorité avec badge
- **Fiche patient** : ruban santé sticky (allergies/traitements/badge "Patient à risque") · bandeau parcours · audit IA + synthèse hebdo IA · discussion d'équipe (chat realtime) · timeline parcours (Démarrer / Terminer) · notes (édition par auteur) · tâches · alertes (résolution 1-clic) · équipe de soins (inviter/retirer) · RDV avec note + docs par RDV · documents · relances multicanales (mock) · journal d'audit · questionnaire complet
- **Page Alertes** : groupé par patient, filtres sévérité
- **Agenda** : RDV groupés par jour
- **Export PDF** de la fiche patient (impression CSS dédiée)

### Côté patient
- **Dashboard compagnon** : prochaine étape · parcours avec progression · prochain RDV · top 3 tâches priorisées · bouton "Signaler"
- **Mon parcours** : timeline complète, tri chronologique
- **Mes RDV** : passés (avec compte rendu) + à venir
- **Mes tâches** : priorisé urgent/important/normal, check interactif
- **Mes documents** : coffre-fort + upload de ses propres documents
- **Mon questionnaire** : édition inline section par section
- **Bottom nav fixe** sur mobile

### Liaison praticien ↔ patient
- Patient signale → alerte praticien (instant via realtime)
- Note praticien + IA Gemini → tâches + alertes + douleurs créées en un clic
- Patient coche tâche → praticien voit le ✓ live
- RDV programmé → étape ajoutée au parcours automatiquement
- Tout est synchronisé via Supabase Realtime

### IA Gemini (gemini-2.5-flash, JSON schema strict)
- **Suggestions** sur création de note : 3 kinds (task | alert | pain_point)
- **Audit complet** de la fiche patient : findings + actions cliquables
- **Synthèse hebdo** : highlights / concerns / next_focus
- **Veille dashboard** : priorise tous les patients + recommandation par patient

### Automatisations
- **Triggers SQL** : recompute auto du `progress_pct`, alerte auto si douleur ≥7, alerte auto sur mots-clés "urgent/stop", escalation patient → douleur sev++, sync questionnaire, notif nouvel assignment
- **Bouton "Lancer la veille"** : 5 checks (relances pré-course J-30/J-15/J-7, rappels veille RDV, RDV non honorés, tâches en retard, douleurs >14j sans RDV)
- **Calculs live** : `weeks_to_race` depuis `race_date`, score de priorité patient

---

## Sécurité / RGPD

C'est un produit médical. RLS très stricte appliquée :

- **Cloisonnement par assignment** : un praticien ne voit / écrit que sur les patients dont il a un `practitioner_assignment.active = true` (helper `is_assigned_to()`).
- **Owner-only writes** : seul l'auteur d'une note peut la modifier ; seul le praticien d'un RDV peut éditer son statut/CR ; seul l'uploader d'un document peut le modifier.
- **Storage privé** : bucket `documents` non public, signed URLs 1h générées server-side.
- **Audit trail** : toute consultation d'une fiche patient est tracée dans `access_log` (RGPD art. 32). Visible côté UI pour le patient et les praticiens assignés.
- **Validation server** : Zod + sanitization HTML sur toutes les server actions.
- **Defense-in-depth** : les feeds praticien re-filtrent par assignment même si la RLS le ferait déjà.

⚠️ Pour passer en prod réelle (vrais patients), il faut encore : hébergement HDS (Supabase ne l'est pas), 2FA, consentement explicite, droit à l'effacement, durée de rétention.

---

## Structure du projet

```
src/
├── app/
│   ├── login/                     # auth
│   ├── dashboard/                 # role-aware (praticien | patient)
│   │   ├── ai-triage*             # Veille IA Gemini
│   │   ├── surveillance-*         # Surveillance temporelle (5 checks)
│   │   └── patient-flag*          # "J'ai un souci à signaler"
│   ├── patients/
│   │   ├── page.tsx               # liste filtrée + score priorité
│   │   └── [id]/                  # fiche centrale (~1000 lignes)
│   │       ├── ai-actions         # suggestions tasks/alerts/pain_points
│   │       ├── ai-audit-*         # Audit
│   │       ├── ai-summary-*       # Synthèse hebdo
│   │       ├── case-discussion    # Chat équipe
│   │       ├── reminders-section  # Relances multicanales
│   │       ├── appointment-notes-panel
│   │       ├── upload-document
│   │       └── ...
│   ├── alerts/, agenda/           # praticien
│   ├── mon-parcours/, mes-rdv/, mes-taches/, mes-documents/, mon-questionnaire/
├── components/
│   ├── app-shell.tsx              # nav role-aware
│   ├── nav-icon.tsx               # ⚠️ icônes par nom (string), pas par composant
│   ├── health-ribbon.tsx          # ruban sticky
│   ├── timeline.tsx
│   ├── document-card.tsx
│   ├── realtime-refresh.tsx
│   └── ...
├── lib/
│   ├── supabase/                  # client / server / proxy
│   ├── auth.ts                    # require[Profile|Practitioner|Patient]()
│   ├── validation.ts              # Schemas Zod + stripHtml
│   ├── storage.ts                 # signed URLs
│   ├── access-log.ts              # logAccess()
│   ├── journey.ts                 # weeksToRace + priorityScore
│   ├── note-suggestions.ts        # heuristique mots-clés (fallback)
│   └── labels.ts                  # labels FR + helpers de date
└── proxy.ts                       # ex-middleware (renommé en Next 16)

supabase/migrations/               # 0001 → 0019
scripts/
├── seed-data.ts, seed.ts          # données de démo
├── verify.ts                      # vérif rapide du seed
├── check-reminders.ts             # vérif des migrations
└── test-gemini.ts                 # smoke test API Gemini

DEMO_ACCOUNTS.md                   # liste des 13 comptes
```

## Design system

Tokens dans [`src/app/globals.css`](src/app/globals.css).

- Fond crème `#F8F5F1`, accent corail `#E86F47`, texte noir doux `#242525`
- Police corps : Inter · Police accent : Cormorant Garamond italique
- Cartes blanches arrondies, ombres douces, design aéré

## Déploiement Vercel

Connecter le repo, reporter les variables d'env (mêmes valeurs que `.env.local`). Les variables `NEXT_PUBLIC_*` et `GEMINI_API_KEY` sont nécessaires en runtime, la `SUPABASE_SERVICE_ROLE_KEY` n'est utile que pour rejouer le seed (ne pas l'exposer en prod).

## Repo

https://github.com/simonjnq/prepamarathon (privé)
