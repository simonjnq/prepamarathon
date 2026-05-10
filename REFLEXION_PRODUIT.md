# PrépaMarathon — Réflexion produit

Document de réflexion accompagnant le MVP. Honnête sur les limites, pratique sur les suites.

---

## 1. Limites de la solution

Le MVP livre une démonstration crédible, mais il porte des limites assumées qu'il faut nommer avant tout déploiement réel.

**Limites réglementaires bloquantes pour la prod**
- **Pas d'hébergement HDS** : Supabase n'est pas certifié Hébergeur de Données de Santé. Inutilisable en l'état pour de vrais patients en France.
- **Pas de DPIA / DPO** documentés. Pour un traitement de données de santé à grande échelle, ces deux éléments sont obligatoires (article 35 RGPD).
- **Pas de flow de consentement explicite** ni de droit à l'effacement (articles 7 et 17 RGPD).
- **Pas de durée de rétention** configurée. Le code de la santé publique impose 10 ans minimum après le dernier acte (30 ans pour les mineurs).

**Limites techniques**
- **IA non auditée cliniquement** : Gemini propose des tâches / alertes / douleurs à partir d'une note libre. Aucune validation médicale formelle de ces sorties. Risque d'hallucination.
- **Mocks** : les relances WhatsApp / SMS / email s'arrêtent au statut `pending`. Aucun vrai envoi.
- **Pas de cron** : la surveillance temporelle (relances pré-course, RDV non honorés…) tourne sur un bouton manuel "Lancer la veille". Pas autonome.
- **Single-tenant** : un seul cabinet implicite. Pas de séparation multi-cabinet.
- **Pas d'app mobile native** : web responsive uniquement (PWA possible mais pas faite). Pas de notifications push.
- **Pas d'intégration externe** : Doctolib / Google Calendar / Strava / Garmin / Apple Health — tout est en silo.
- **Pas de versionnage des plans** : si un praticien modifie une étape, on perd l'ancienne version.
- **Realtime brut** : un changement déclenche un `router.refresh()` complet, pas de patch optimiste.

**Limites produit / UX**
- **Modèle de données spécifique marathon** : enums `sport_goal` figés (marathon, semi, 10km, 5km, running, reprise). Pivot vers triathlon ou rééducation post-op = refonte modeste mais réelle.
- **Localisation FR seulement**. Pas d'i18n.
- **Pas d'audit accessibilité** (WCAG 2.1 AA non vérifié).
- **Pas de mode hors-ligne** : un patient sans connexion ne peut rien.
- **Pas de paiement / facturation** : pas d'honoraires gérés, pas de tiers payant, pas d'export comptable.

**Limites opérationnelles**
- **13 comptes fictifs**, données synthétiques. Pas de cas limites réels (patient avec 50 RDV, douleur chronique de 3 ans, etc.).
- **Authentification basique** : email + mot de passe partagé. Pas de 2FA, pas de SSO entreprise, pas de magic link.
- **Pas de support utilisateur** : ni hotline ni chat in-app.

---

## 2. Fonctionnalités prioritaires après cette première version

Hiérarchisées par "ce qui débloque le passage en prod" → "ce qui élargit le marché".

**Tier 1 — débloquer la prod (sans ça, on ne peut pas vendre)**
1. **Migration vers un hébergement HDS** (OVH, Outscale, AWS éligible) ou auto-hébergement de Supabase sur infra HDS.
2. **2FA praticien** (Supabase MFA dispo, à activer + flow d'onboarding).
3. **Consentement explicite + droit à l'effacement** (article 17) + portabilité (article 20).
4. **Durée de rétention configurée** (10 ans / 30 ans pour mineurs) + purge automatisée.
5. **Vrai cron** pour la surveillance temporelle (pg_cron Supabase ou Vercel cron, qui appelle `runSurveillance` quotidiennement).
6. **Vrais envois de relances** : Resend pour email, Twilio pour SMS, Twilio WhatsApp Business ou Meta Cloud API. Web Push pour notifications.

**Tier 2 — densifier la valeur cabinet**
7. **Intégration calendrier** (Google Calendar / Outlook / Doctolib) pour synchroniser les RDV.
8. **Téléconsultation** intégrée (Twilio Video, Whereby, ou intégration Doctolib / Maiia).
9. **Plans d'entraînement générés par l'IA** : à partir de la VMA, FCmax et de l'objectif, Gemini propose un plan hebdo personnalisé que le praticien valide.
10. **Templates de notes** par type de consultation (premier bilan, suivi kiné, contrôle cardio…) pour réduire le coût de saisie.
11. **Saisie vocale des notes** (Gemini multimodal ou Whisper) — gain de temps majeur en pratique cabinet.

**Tier 3 — élargir les parcours**
12. **Autres parcours sportifs** : trail, ultra, triathlon, cyclo, course en montagne. Le modèle de données scale moyennant un enum plus large.
13. **Parcours médicaux non sportifs** : reprise post-op, gestion poids, prépa accouchement, parcours sénior actif, suivi maladie chronique. Vraie verticalisation.
14. **App mobile patient native** (React Native ou Expo) avec push notifications, mode offline, capture photo / vidéo.
15. **Connexion objets connectés** (Garmin, Apple Health, Strava) : import auto des sorties, FC, sommeil, charge.

---

## 3. Comment faire évoluer ce produit

Roadmap par phases, chacune produisant une valeur démontrable.

**V1.0 — MVP démontrable** (livré)
- Coordination de soins, IA d'assistance, RGPD strict (sauf hébergement), automatisations en démo.

**V1.5 — Stabilisation production** (3 mois)
- Conformité HDS, 2FA, vraies relances, consentement, droit à l'effacement, audit clinique des prompts IA, monitoring (Sentry, Datadog), tests automatisés (E2E + unit), CI/CD.

**V2 — Élargissement vertical** (6 mois)
- Multi-parcours sportif, multi-cabinet, app mobile patient, intégration calendrier praticien, téléconsultation, paiement / facturation, marketplace de praticiens partenaires.

**V3 — IA prédictive et médecine connectée** (12 mois)
- Import objets connectés (Garmin, Apple Health), IA prédictive de risque blessure (charge / sommeil / FC repos), plans d'entraînement adaptatifs, comparaisons cohorte ("comment se situe ma préparation par rapport aux autres marathoniens de mon âge").

**V4 — Plateforme verticale** (18-24 mois)
- Pivots vers parcours médico-sportifs adjacents (rééducation post-op, pédiatrie sportive, sénior actif), parcours préventifs (prépa accouchement, prévention cardio), modules métiers spécifiques par profession (ostéo, nutrition, psy du sport).

**Modèle économique à explorer** (parallèle à toutes les phases)
- **B2B2C** : abonnement cabinet, gratuit pour les patients suivis. Modèle classique de SaaS médical.
- **B2C** : abonnement direct patient (free + premium). Risque de churn fort.
- **Hybride** : freemium patient (suivi basique) + premium cabinet (coordination + IA + relances).
- **Capitation** : modèle de paiement par tête / par parcours, partagé entre cabinet et patient.

---

## 4. Points de vigilance — techniques, opérationnels, réglementaires

### Réglementaire (le plus critique pour une app médicale)

| Sujet | Risque | Mitigation |
|---|---|---|
| **HDS** | Stockage en France obligatoire pour données santé | Migration vers OVHcloud HDS / Outscale / AWS HDS-eligible |
| **RGPD art. 9** (catégorie spéciale) | Consentement explicite obligatoire pour la collecte | Flow d'onboarding bloquant avec consentement granulaire |
| **RGPD art. 32** (sécurité) | Audit logs obligatoires | ✅ déjà en place (`access_log` + RPC `log_access`) |
| **Article 17** (effacement) | Devoir d'oubli | Bouton "supprimer mon compte" + soft-delete + purge planifiée |
| **MDR / dispositif médical** | Si l'IA est qualifiée de DM, certification CE obligatoire | Disclaimer fort + validation médicale des prompts. À faire valider par un avocat spécialisé. |
| **Code de déontologie médicale** | Secret professionnel | ✅ partiellement en place via RLS par assignment |
| **Code santé publique** | Conservation 10 ans / 30 ans mineurs | Politique de rétention + archivage froid |
| **CNIL** | Déclaration de traitement | Inscription registre + DPIA pour traitement à grande échelle |

### Technique

- **Dépendance Gemini** : pannes API Google ou changement de modèle. Garder une heuristique fallback (déjà en place pour les suggestions de notes).
- **Coût IA scalable** : à grande échelle, monitorer le coût par patient. Cache prompts (déjà actif via `cache_control: ephemeral` sur le system prompt).
- **Realtime à scale** : Supabase realtime a une limite de connexions simultanées. Au-delà de quelques milliers de praticiens connectés, partitionnement requis ou plan dédié.
- **Croissance des données** : `notes`, `appointments`, `case_messages` peuvent devenir lourds. Indexation, partitions par date, archivage.
- **Backups** : Supabase fait du PITR automatique sur le plan Pro. Tester réellement la restauration au moins une fois par trimestre.
- **Pen-test** : audit sécurité externe avant prod. Bug bounty post-lancement.
- **Accessibilité** : audit WCAG 2.1 AA. Une partie significative de la patientèle peut avoir un déficit visuel ou moteur.
- **Versionnage des migrations** : actuellement 19 fichiers SQL numérotés à la main. Pour une équipe, basculer vers Sqitch / supabase-cli ou Prisma.

### Opérationnel

- **Adoption praticiens** : un médecin du sport débordé n'a pas le temps d'apprendre un nouvel outil. Le coût d'usage doit être < à la valeur perçue. L'IA aide énormément ici (une note → tâches + alertes + douleurs en un clic vs saisie manuelle de 5 minutes).
- **Adoption patients** : ne pas demander un questionnaire de 50 questions au signup. Onboarding progressif.
- **Responsabilité médicale** : qui est responsable si une suggestion IA est suivie et que le patient se blesse ? Disclaimer obligatoire + validation médicale des prompts + journal d'audit (déjà en place).
- **Modèle de tarification** : qui paie ? Pas trivial dans le médical français. À tester avec un cabinet pilote.
- **Support** : hotline / chat in-app pour les praticiens (les patients peuvent appeler le cabinet).

---

## 5. Améliorer l'expérience — priorités UX

Triées par "ratio impact / effort".

**Côté praticien (haute priorité)**
- **Saisie vocale des notes** (Gemini multimodal). Une note de 30 secondes vs 2 minutes de typing.
- **Templates de notes** prêtes par type de consultation. Moins de friction.
- **Vue cabinet hebdomadaire** (un seul écran avec planning + alertes + RDV du jour).
- **Recherche cross-patient** ("tous mes patients avec tendinite achille").
- **Notifications push praticien** (push web puis mobile native) — alerte critique sur un patient assigné.
- **Hot keys / command palette** (Cmd+K) pour navigation experte.

**Côté patient (haute priorité)**
- **App mobile native** (PWA dans un premier temps, React Native après). Notifications push, capture photo / vidéo, mode offline.
- **Mode photo** : un patient envoie une photo de sa cheville → alerte visuelle pour le praticien.
- **Plans d'exercices vidéo** (kiné, étirements, renforcement). Intégration ou hébergement.
- **Connexion auto Strava / Garmin** pour récupérer les sorties sans saisie.
- **Gamification légère** : badges quand les tâches sont respectées, progression émotionnelle, encouragements.
- **Chat direct patient ↔ praticien** (pas seulement signalement). Avec garde-fou "ne remplace pas la consultation".

**Pour les deux**
- **Dark mode**.
- **Multilingue** (anglais d'abord, espagnol ensuite).
- **Export PDF enrichi** d'une fiche patient (déjà à minima, à enrichir avec graphes d'évolution).
- **Personnalisation par cabinet** (logo, couleurs).

---

## 6. Points de vigilance — techniques et organisationnels

(Angle équipe / process / opérations, complémentaire au § 4.)

### Équipe et organisation

- **Composition minimale prod-ready** : 1 dev backend, 1 dev frontend, 1 product manager, 1 médecin conseil (validation clinique des features et prompts IA), 1 DPO (à temps partiel ok au début), 1 designer.
- **Cabinet pilote** : Via Sana est probablement ce partenaire. Tester chaque feature en cabinet réel avant release. Itérer sur 5-10 patients avant scale.
- **Comité éthique** : pour les features IA qui touchent au clinical, prévoir un avis externe régulier (médecin + juriste).
- **Documentation médicale** : chaque feature qui modifie une donnée patient doit être documentée pour traçabilité (utile en cas d'audit CNIL ou de litige).
- **Roadmap découpée en releases courtes** (2 à 4 semaines) avec démo praticiens à chaque fin. Éviter le tunnel de 6 mois.

### Process technique

- **CI/CD** à mettre en place avant le passage en prod. Pas de tests pour l'instant — ajouter au minimum :
  - Tests E2E (Playwright) sur les parcours critiques (login, signalement patient, audit IA, création RDV).
  - Tests unitaires sur les helpers (`priorityScore`, `weeksToRace`, `suggestTaskFromNote`).
  - Tests de migration : rejouer une migration sur une copie de prod avant de la pousser.
- **Code review** : actuellement single-dev. Ajouter une 2e personne dès l'arrivée d'un dev junior. Checklist obligatoire :
  - Toute server action touchant à des données patient doit appeler `requireProfile/Practitioner/Patient`.
  - Toute insertion / modification doit passer par Zod.
  - Toute requête doit être filtrée par `is_assigned_to(patient_id)` ou `patient_id = auth.uid()` (jamais d'`is_practitioner()` seul).
- **Monitoring** : Sentry pour les erreurs front + back, Datadog pour les métriques infra, alerting Slack sur les erreurs critiques.
- **Observabilité Postgres** : Supabase expose des slow queries, à monitorer.
- **Versionnage des prompts IA** : si on change un prompt, on doit pouvoir refaire tourner l'ancien sur de vieilles données pour comparer.

### Risques organisationnels

- **Dépendance d'une seule personne** : actuellement le projet est porté par un seul développeur. Bus factor = 1. Document à jour ([CLAUDE.md](CLAUDE.md)) + onboarding agent expressément conçu pour minimiser ce risque.
- **Scope creep** : facile de vouloir ajouter "encore une feature". Discipline : ne pas faire de V2 sans avoir un cabinet pilote en prod sur V1.5.
- **Pression réglementaire** : la conformité HDS prend 3-6 mois en réel. À prévoir tôt dans la roadmap, pas en patchwork de dernière minute.
- **Adoption versus concurrence** : Doctolib, Maiia, Tixapro existent. Le différenciant doit être clair (coordination IA + parcours sportif spécifique) — sinon on tombe dans une commodité.
- **Validation médicale continue** : les prompts IA et les heuristiques évoluent. Chaque modification doit repasser par le médecin conseil pour ne pas dégrader la qualité clinique.

---

## TL;DR

Le MVP démontre la promesse — coordination, IA d'assistance, automatisations, RGPD aussi strict que possible côté applicatif. **Il n'est pas prod-ready** : il manque l'hébergement HDS, les vraies relances, le 2FA, les flows RGPD complets, et des tests automatisés. L'effort prioritaire pour passer en prod est environ **3 mois**, l'effort pour V2 (multi-parcours, mobile, intégrations) **6 mois supplémentaires**.

La force du produit n'est pas la fiche patient (commodité) ni le RDV (Doctolib le fait mieux), c'est la **coordination IA-assistée** entre praticiens et patient sur la durée d'une préparation. C'est sur ce différenciant qu'il faut continuer à investir.
