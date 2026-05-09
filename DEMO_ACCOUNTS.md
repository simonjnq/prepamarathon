# Comptes de démo PrépaMarathon

Tous les comptes utilisent le même mot de passe.

**Mot de passe (tous les comptes)** : `testprepamarathon`

Sur l'écran de connexion, vous pouvez taper soit l'identifiant court (ex.
`marie.dubois`) soit l'email complet (ex. `marie.dubois@prepa.test`). Les deux
fonctionnent.

---

## Praticiens (5)

Format identifiant : `nom.metier`.

| Identifiant | Nom | Spécialité | Cabinet |
| --- | --- | --- | --- |
| `laurent.medecindusport` | Dr Hélène Laurent | Médecin du sport | Cabinet Vélodrome (Paris 11e) |
| `dupont.kine` | Pierre Dupont | Kinésithérapeute | Kiné Sport Bastille (Paris 11e) |
| `mercier.osteo` | Claire Mercier | Ostéopathe | Ostéopathie République (Paris 3e) |
| `fontaine.nutritionniste` | Marc Fontaine | Nutritionniste | Nutrition & Performance (Paris 9e) |
| `girard.podologue` | Anne Girard | Podologue | Podologie du Marais (Paris 4e) |

---

## Patients (8)

Format identifiant : `prenom.nom`.

| Identifiant | Nom | Âge | Objectif | Profil clinique |
| --- | --- | --- | --- | --- |
| `marie.dubois` | Marie Dubois | 34 | Marathon de Berlin (sept. 2026) | Douleur mollet droit en suivi kiné |
| `thomas.lefebvre` | Thomas Lefebvre | 47 | Semi-marathon de Paris (sept. 2026) | HTA contrôlée, antécédents cardio familiaux |
| `camille.martin` | Camille Martin | 31 | Marathon de Reims (oct. 2026) | Fatigue chronique, bilan biologique en cours |
| `julien.bernard` | Julien Bernard | 28 | Marathon de La Rochelle (nov. 2026) | Récupération difficile, charge à modérer |
| `sophie.petit` | Sophie Petit | 41 | 10 km de Paris (sept. 2026) | Reprise après ligamentoplastie LCA droit |
| `antoine.rousseau` | Antoine Rousseau | 36 | Marathon de Berlin (sept. 2026) | Tendinite achille gauche, suivi kiné renforcé |
| `lea.moreau` | Léa Moreau | 26 | Semi-marathon de Lyon (oct. 2026) | Tendinite achille débutante, alerte ouverte |
| `nicolas.garcia` | Nicolas Garcia | 52 | Marathon Nice-Cannes (nov. 2026) | HTA contrôlée par Cozaar, suivi cardio |

---

## Comment regénérer les comptes

```bash
# 1. Charger le schéma une fois (Supabase SQL Editor)
#    → Coller le contenu de supabase/migrations/0001_initial_schema.sql

# 2. Lancer le seed (idempotent — supprime les comptes @prepa.test puis recrée tout)
npm run seed
```

Le seed s'appuie sur les variables d'environnement de `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_USER_PASSWORD`
- `DEMO_EMAIL_DOMAIN` (par défaut : `prepa.test`)
