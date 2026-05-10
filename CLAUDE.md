@AGENTS.md

# PrépaMarathon — Via Sana

MVP de coordination de soins pour la préparation marathon, **étude de cas** (pas prod). L'app doit donner l'impression d'un produit médical réel : 13 comptes de démo, scénarios cliniques cohérents, automatisations IA visibles.

Le contexte produit complet est dans **[context.md](context.md)** à la racine. Lire en priorité si on touche aux features.

## Stack & contraintes

- **Next.js 16** (App Router, Turbopack) + **Tailwind 4** + **Supabase** (Auth, Postgres, Storage, Realtime) + **Gemini 2.5 Flash** (`@google/genai`).
- ⚠️ Next.js 16 a renommé `middleware.ts` → **`proxy.ts`** (export `proxy`, pas `middleware`). Le fichier vit à `src/proxy.ts`.
- Tailwind 4 utilise `@theme` dans `globals.css`. Les radius (`rounded-md` = `--radius-md` = 14px) sont définis là.
- `cookies()` est async (Next 15+). Voir `src/lib/supabase/server.ts`.
- **Date démo codée en dur : `2026-05-10`** (apparaît dans `actions.ts`, `seed-data.ts`, `journey.ts`, `surveillance-actions.ts`, `globals.css`). Tous les calculs relatifs partent de cette ancre.
- **Hébergement Supabase cloud** (project ref `hwozqwinxofafotufcbs`). Variables dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `DEMO_USER_PASSWORD`, `DEMO_EMAIL_DOMAIN`).

## Comptes de démo

Tous mot de passe : **`testprepamarathon`**. Domaine email : `prepa.test`. Liste complète dans [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

- **5 praticiens** : `laurent.medecindusport`, `dupont.kine`, `mercier.osteo`, `fontaine.nutritionniste`, `girard.podologue`
- **8 patients** : `marie.dubois`, `thomas.lefebvre`, `camille.martin`, `julien.bernard`, `sophie.petit`, `antoine.rousseau`, `lea.moreau`, `nicolas.garcia`

Le seed est dans `scripts/seed.ts` + `scripts/seed-data.ts`. Lancer avec `npm run seed` (idempotent : supprime tous les comptes `@prepa.test` puis recrée). Re-seed nuke les notes/tâches manuellement créées pendant la démo.

## Schéma DB & migrations

`supabase/migrations/` numérotées de **0001 à 0019** au moment d'écrire ces lignes. Chaque migration a un commentaire d'intro qui dit ce qu'elle fait. À chaque nouvelle migration, donner à l'utilisateur le SQL à coller dans Supabase SQL Editor (il n'y a pas de Supabase CLI configuré).

Tables principales : `profiles`, `practitioners`, `patients`, `journeys`, `journey_steps`, `practitioner_assignments`, `appointments`, `notes`, `tasks`, `alerts`, `pain_points`, `documents`, `questionnaire_responses`, `reminders`, `case_messages` (discussion équipe), `access_log` (audit RGPD).

### Helpers SQL clés (à connaître)

- `public.is_practitioner()` — l'utilisateur est-il un praticien
- `public.is_assigned_to(uuid)` — l'utilisateur a-t-il un assignment actif vers ce patient (✨ pivot RGPD)
- `public.log_access(patient_id, action, resource)` — RPC `security definer` qu'on appelle depuis les pages pour tracer l'accès
- `public.recompute_journey_progress(uuid)` — déclenchée par trigger sur `journey_steps`
- `public.try_uuid(text)` — cast safe utilisé dans les policies Storage

## Sécurité / RGPD — non-négociable

C'est un produit médical. Toute modification doit préserver :

1. **Cloisonnement par assignment** : aucun praticien ne voit / écrit sur un patient sans `practitioner_assignment.active = true`. La policy clé est `is_assigned_to(patient_id)` répétée sur toutes les tables liées au patient.
2. **Ownership writes** : seul l'auteur d'une note peut la modifier (`practitioner_id = auth.uid()`), seul le praticien d'un RDV peut éditer son statut/CR (`practitioner_id = auth.uid()`), seul l'uploader d'un doc peut le modifier/supprimer (`uploaded_by = auth.uid()`).
3. **Storage `documents` privé** : bucket `public=false`, on ne stocke que le **path** dans `documents.file_url`, on génère des **signed URLs 1h** côté serveur via `src/lib/storage.ts` (`generateDocumentSignedUrls`).
4. **Audit trail** : `src/lib/access-log.ts` → appel `logAccess()` à chaque vue de fiche patient. Le journal est lu côté UI dans la fiche (section "Historique de consultation").
5. **Validation server-side** : toutes les server actions passent par `src/lib/validation.ts` (Zod + `stripHtml`) qui cap les longueurs et neutralise les balises HTML.
6. **Defense-in-depth** : le dashboard et /alerts re-filtrent explicitement par `myPatientIds` même si la RLS le ferait déjà — protège d'une régression de policy.

Avant de modifier une RLS, exécuter mentalement le scénario : "un praticien non assigné peut-il lire/écrire ?". Si oui, c'est un bug.

## Architecture front

```
src/
├── app/
│   ├── login/                 # auth
│   ├── dashboard/             # role-aware (PractitionerDashboard | PatientDashboard)
│   │   ├── ai-triage*         # Veille IA (B4)
│   │   ├── surveillance-*     # Bouton "Lancer la veille" (Bloc 3)
│   │   ├── patient-flag*      # "J'ai un souci à signaler"
│   │   └── actions.ts         # flagFromPatientAction
│   ├── patients/              # praticien
│   │   ├── page.tsx           # liste filtrée + score priorité + segmented control
│   │   └── [id]/
│   │       ├── page.tsx       # fiche complète (centrale, ~900 lignes — beaucoup d'agrégation)
│   │       ├── actions.ts     # CRUD notes/RDV/tasks/alerts/docs/assignments
│   │       ├── ai-actions.ts  # aiSuggestFromNote (3 kinds: task/alert/pain_point)
│   │       ├── ai-audit-*     # Audit fiche
│   │       ├── ai-summary-*   # Synthèse hebdo (B1)
│   │       ├── case-discussion + discussion-actions    # Chat équipe
│   │       ├── reminders-section + reminder-actions    # Relances mock
│   │       ├── appointment-notes-panel                 # Note + docs par RDV
│   │       ├── new-note-form / new-appointment-form
│   │       ├── upload-document
│   │       ├── note-row, step-actions, appointment-actions, add-practitioner
│   │       └── ...
│   ├── alerts/                # praticien — groupé par patient
│   ├── agenda/                # praticien — RDV par jour
│   ├── mon-parcours/          # patient
│   ├── mes-rdv/               # patient
│   ├── mes-taches/            # patient (priorité urgent/important/normal)
│   ├── mes-documents/         # patient (upload + coffre-fort)
│   └── mon-questionnaire/     # patient (édition inline)
├── components/
│   ├── app-shell.tsx          # layout + nav role-aware (sidebar desktop, BottomNav mobile patient)
│   ├── nav-icon.tsx           # ⚠️ on passe iconName: string, JAMAIS le composant Lucide directement
│   ├── nav-link.tsx, bottom-nav.tsx
│   ├── health-ribbon.tsx      # ruban sticky en haut de fiche (allergies + traitements + "Patient à risque")
│   ├── timeline.tsx           # parcours, tri par scheduled_at
│   ├── document-card.tsx      # download-only quand file_url existe
│   ├── realtime-refresh.tsx   # subscribe + router.refresh() debounced 250ms
│   ├── badge.tsx, avatar.tsx, print-button.tsx
├── lib/
│   ├── supabase/              # client / server / proxy
│   ├── auth.ts                # requireProfile / requirePractitioner / requirePatient
│   ├── validation.ts          # Schemas Zod + stripHtml + field()
│   ├── storage.ts             # signed URLs
│   ├── access-log.ts          # logAccess()
│   ├── journey.ts             # weeksToRace + priorityScore + priorityLabel
│   ├── note-suggestions.ts    # heuristique mots-clés (fallback si Gemini absent)
│   └── labels.ts              # tous les labels FR + helpers de date
└── proxy.ts                   # ex-middleware Next 16, refresh session + redirect non-auth
```

## Automatisations en place

| # | Type | Quoi | Où |
|---|---|---|---|
| A1 | Trigger SQL | progress_pct recalculé sur INSERT/UPDATE/DELETE journey_steps | 0018 |
| A2 | UI calc | weeks_to_race calculé live depuis race_date | `lib/journey.ts` |
| A3 | UI calc | Score de priorité + tri /patients + badges | `lib/journey.ts` + `app/patients/page.tsx` |
| A4 | Trigger SQL | pain_point sev≥7 → alerte 'urgent' | 0018 |
| D1 | Trigger SQL | note avec mot-clé "urgent/stop/immédiatement" → alerte | 0018 |
| D2 | Trigger SQL | patient signale urgent → pain_points sev++ | 0019 |
| D3 | UI | badge "Patient à risque" dans health-ribbon (≥2 urgentes) | `components/health-ribbon.tsx` |
| D4 | Trigger SQL | pain_points écrit → questionnaire pain_current sync | 0019 |
| D5 | Trigger SQL | nouvel assignment → alerte info patient | 0019 |
| B1 | IA Gemini | Synthèse hebdo (à la demande) | `app/patients/[id]/ai-summary-*` |
| B4 | IA Gemini | Veille dashboard (priorise + recommande) | `app/dashboard/ai-triage-*` |
| C1-C5 | Server action manuelle | Bouton "Lancer la veille" (relances, RDV non honorés, tâches retard, douleurs non monitorées) | `app/dashboard/surveillance-*` |
| — | IA Gemini | Suggestions tasks/alerts/pain_points sur création de note | `app/patients/[id]/ai-actions.ts` |
| — | IA Gemini | Audit complet de la fiche patient | `app/patients/[id]/ai-audit-*` |

## Conventions

- **Server actions** : toujours `requireProfile/Practitioner/Patient()` en premier, puis Zod via `field(formData, key, Schemas.X)`, puis insert/update.
- **Pas de fonction passée en props server→client** : pour les icônes Lucide, on passe `iconName: string` et on map dans `nav-icon.tsx`.
- **PostgREST embed** : éviter `relation:fk_column (...)` qui peut casser. Préférer queries séparées + Map en JS pour les agrégations (cf. fix `profiles:id` dans 0008-ish).
- **`file_url` dans documents** = **path Storage** (pas URL publique). Toujours `generateDocumentSignedUrls` pour résoudre.
- **Realtime** : pour qu'un changement déclenche un refresh, la table doit être dans la publication `supabase_realtime` (cf. 0007, 0008, 0010).
- **Tailwind** : utiliser les classes canoniques (`rounded-md`, `text-xs!` avec `!` après) plutôt que `rounded-[14px]` ou `!text-xs`.

## Gotchas

- **Re-seed nuke les données manuelles** (notes/RDV créés à la souris). Prévenir l'utilisateur avant un re-seed.
- **Migration vs SQL Editor** : pas de Supabase CLI configuré. Pour appliquer une migration, on fournit le SQL inline à l'utilisateur qui le colle dans le SQL Editor.
- **Service role key** : exclusivement pour les scripts (`scripts/`). Jamais dans `src/`.
- **proxy.ts (ex-middleware)** : si on touche au matcher, exclure `_next/static`, `_next/image`, `favicon.ico` et les assets statiques.
- **`alertsByPatient.get(...).filter(...)` typing** : Supabase queries non typées (pas de génération de types depuis le schéma). Beaucoup de `as unknown as` dans les pages — c'est volontaire, mais à remplacer par des types générés un jour.

## Ce qui reste à faire

(Pour ne pas y revenir et créer du double travail.)

- **Vrai pg_cron** pour la surveillance temporelle (actuellement bouton manuel "Lancer la veille").
- **Vrai envoi de relances** (Resend / Twilio / WhatsApp Business) — actuellement mock, status `pending` → `sent` à la main.
- **HDS hosting** : Supabase n'est pas certifié HDS. Pour un déploiement prod réel sur des données de santé en France, il faudra OVH HDS / Outscale / AWS HDS-eligible region.
- **2FA praticien** (Supabase MFA dispo, pas activé).
- **Consentement RGPD explicite** + droit à l'effacement (article 17) + portabilité (article 20).
- **Tests** (zéro pour l'instant).
- **Types Supabase générés** depuis le schéma.
- **Polish** : empty states illustrés, hero/landing publique, animations.

## Workflow agent

- Avant d'ajouter une feature qui touche à la sécurité, **lire les migrations 0011, 0012, 0013** (RGPD strict + ownership + storage privé). Toute extension doit s'aligner.
- Avant de toucher au schéma : `grep -rn "<nom_table>" src/` pour repérer les usages, vérifier qu'on ne casse pas une server action / RLS.
- Build local : `npm run build`. Toujours vérifier avant de commit.
- Lint : `npm run lint`.
- Test Gemini : `npx tsx scripts/test-gemini.ts`.
- Vérif DB : `npx tsx scripts/check-reminders.ts`.
- Repo : https://github.com/simonjnq/prepamarathon (privé).
