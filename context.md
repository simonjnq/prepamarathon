# PrépaMarathon by Via Sana — Contexte Produit, Vision & MVP Technique

# IMPORTANT — Objectif de ce document

Ce document sert à donner un maximum de contexte produit, métier et technique afin de permettre le développement d’un MVP cohérent.

L’objectif est que l’implémentation ne soit pas pensée comme :

* un simple CRUD médical ;
* une simple application de rendez-vous ;
* ou une simple dashboard admin.

Le cœur du produit est :

* la coordination entre praticiens ;
* la centralisation des informations ;
* la continuité du suivi ;
* les automatisations ;
* et la visibilité globale du patient pendant sa préparation sportive.

Le MVP doit rester réaliste et démontrable.

Il ne s’agit PAS de construire un logiciel médical complet.

L’objectif est de produire :

* une expérience cohérente ;
* un produit crédible ;
* une démonstration fonctionnelle ;
* et une architecture suffisamment propre pour pouvoir évoluer.

---

# Contexte du projet

Via Sana développe des parcours de soins coordonnés : des programmes où plusieurs professionnels de santé accompagnent un même patient autour d’un objectif précis.

Le cas d’usage principal étudié ici est PrépaMarathon.

Le but est de construire un MVP fonctionnel permettant de suivre un patient dans sa préparation sportive et médicale avant une course.

Même si le cas principal démontré reste la préparation marathon, l’application doit être pensée de manière suffisamment flexible pour pouvoir gérer d’autres objectifs sportifs :

* marathon
* semi-marathon
* 10 km
* 5 km
* running
* reprise sportive

Le MVP doit néanmoins rester centré sur le cas PrépaMarathon.

---

# Compréhension du problème métier

Aujourd’hui, le suivi des patients repose sur des outils dispersés :

* formulaires externes
* emails
* WhatsApp
* notes manuelles
* fichiers partagés
* échanges informels entre praticiens

Cette fragmentation crée plusieurs problèmes :

* mauvaise coordination entre praticiens
* mauvaise visibilité du parcours du patient
* perte d’informations importantes
* difficulté à maintenir un suivi continu
* difficulté à gérer plusieurs patients et plusieurs parcours en parallèle
* difficulté à centraliser traitements, douleurs, antécédents et recommandations

L’objectif du produit est donc de centraliser les informations du patient et fluidifier la coordination ainsi que le suivi continu entre praticiens et patient pendant toute la préparation sportive.

---

# Compréhension produit importante

Le projet n’est pas simplement une plateforme de suivi de marathon.

Le besoin réel identifié après analyse du questionnaire et du site PrépaMarathon est davantage :

> un système de coordination de soins et de suivi sportif centré sur le patient.

Le produit doit permettre :

* de connecter plusieurs professionnels autour d’un même patient ;
* de maintenir une continuité de suivi ;
* de centraliser les informations ;
* de fluidifier les échanges ;
* et d’éviter les pertes d’informations.

Le marathon sert principalement de cas d’usage concret.

---

# Vision produit

Le produit repose sur deux interfaces connectées :

* une interface praticien
* une interface patient

Les deux interfaces doivent être synchronisées afin de permettre :

* la circulation des informations
* la continuité du suivi
* la coordination des professionnels
* la génération de recommandations et tâches intelligentes
* les automatisations de suivi

Le produit doit fonctionner comme un système connecté et non comme deux interfaces séparées.

---

# Vision côté praticien

L’interface praticien constitue le cœur métier du produit.

Le praticien doit pouvoir :

* suivre ses patients
* voir leur progression
* centraliser toutes les informations
* suivre les douleurs/blessures
* consulter les réponses du questionnaire médical
* suivre les recommandations
* coordonner les différents professionnels
* maintenir un suivi actif jusqu’à la course

---

# Dashboard praticien multicouche

Une notion importante dans la vision produit est la logique de dashboard multicouche.

Le praticien doit pouvoir naviguer à différents niveaux de profondeur.

Moins il clique :

* plus il garde une vue globale.

Plus il clique :

* plus il entre dans le détail.

Le dashboard doit permettre :

* une vue d’ensemble rapide
* puis une navigation détaillée vers les patients et leur parcours.

Exemples de vues possibles :

* vue globale patients
* vue par objectif sportif
* vue par statut
* vue par douleur/blessure
* vue par praticien impliqué
* vue par progression

Cette logique multicouche est considérée comme importante dans la vision du produit.

---

# Vision côté patient

L’interface patient doit être plus simple, guidée et accessible.

Le patient ne doit pas gérer une interface médicale complexe.

L’objectif est plutôt :

* comprendre son parcours
* suivre sa préparation
* retrouver ses rendez-vous
* voir ses recommandations
* répondre aux suivis
* rester connecté aux praticiens

L’expérience doit être proche d’une logique d’application compagnon de préparation sportive.

---

# Questionnaire médical

Le questionnaire PrépaMarathon constitue une base importante du produit.

Les questions portent notamment sur :

* antécédents cardiaques
* santé respiratoire
* douleurs musculaires
* blessures
* récupération
* fatigue
* sommeil
* nutrition
* hydratation
* traitements
* charge d’entraînement
* relation psychologique à la course

Le MVP doit intégrer ce questionnaire.

Cependant :

* aucune intégration réelle au formulaire actuel n’est possible
* aucune permission ou accès technique n’est disponible

Le choix retenu est donc :

* reprendre les questions principales
* recréer le questionnaire dans l’application
* générer de faux profils patients réalistes
* utiliser des données cohérentes pour alimenter les parcours

Exemples de profils :

* marathonien avec douleur musculaire
* patient avec fatigue chronique
* coureur avec antécédents cardiaques
* patient avec mauvaise récupération
* suivi kiné avant course

---

# Priorisation réelle du MVP

Le MVP doit être pensé avec une logique de priorisation claire.

---

# Ce qui est PRIORITAIRE dans le MVP

Les éléments suivants sont considérés comme essentiels :

## 1. Structure technique propre

* auth
* rôles
* base de données
* architecture propre
* modèle de données cohérent

---

## 2. Interface praticien

Le dashboard praticien est considéré comme le cœur métier du MVP.

Le praticien doit pouvoir :

* visualiser ses patients ;
* suivre leur progression ;
* voir les alertes ;
* consulter les réponses du questionnaire ;
* suivre les douleurs/blessures ;
* coordonner les différents professionnels ;
* ajouter des notes et recommandations.

---

## 3. Interface patient

Le patient doit pouvoir :

* suivre sa préparation ;
* voir son parcours ;
* consulter ses rendez-vous ;
* voir ses recommandations ;
* répondre aux suivis ;
* suivre ses tâches.

---

## 4. Liaison praticien ↔ patient

Cette partie est extrêmement importante.

Les deux interfaces ne doivent pas fonctionner séparément.

Il faut démontrer :

* la synchronisation des données ;
* les notes praticien → tâches patient ;
* les réponses patient → alertes praticien ;
* les recommandations → actions ;
* les mises à jour automatiques du parcours.

---

## 5. Automatisations et IA

Les automatisations font partie de la vision cœur du produit.

Même si elles restent simples dans le MVP, elles doivent être visibles.

Le produit doit montrer :

* relances automatiques ;
* tâches générées automatiquement ;
* logique d’assistance IA ;
* continuité du suivi entre les consultations.

---

# Ce qui est BONUS / LONG TERME

Ces fonctionnalités sont intéressantes mais non critiques pour le MVP :

* analytics avancés ;
* collaboration temps réel poussée ;
* messagerie complexe ;
* IA médicale avancée ;
* système prédictif ;
* recherche multicouche complexe ;
* dashboards ultra avancés ;
* vues cabinet complexes.

---

# Fonctionnalités MVP — Interface praticien

## Dashboard praticien

Fonctionnalités principales :

* liste des patients
* filtres
* vue globale
* alertes
* suivi des parcours
* progression des patients

Filtres possibles :

* par parcours
* par étape
* par statut
* par progression
* par objectif sportif
* par douleur/blessure

---

## Fiche patient centralisée

Chaque patient possède une fiche regroupant :

* identité
* objectif sportif
* réponses du questionnaire
* antécédents
* traitements
* allergies
* historique
* documents
* praticiens impliqués
* prochaines séances
* notes de suivi
* progression du parcours

---

## Visualisation du parcours

Le praticien doit pouvoir voir :

* étapes réalisées
* étapes en cours
* étapes restantes
* consultations effectuées
* suivis encore nécessaires

Exemples :

* suivi kiné
* suivi ostéo
* nutrition
* contrôle avant course
* gestion douleur musculaire

---

## Notes et recommandations

Le praticien doit pouvoir :

* ajouter des notes
* ajouter des recommandations
* ajouter des suivis
* créer des alertes simples
* suivre l’historique des échanges

Ces notes serviront ensuite :

* aux automatisations
* aux relances
* à la génération de tâches côté patient

---

# Fonctionnalités MVP — Interface patient

## Vue parcours patient

Le patient doit pouvoir voir :

* progression globale
* étapes réalisées
* étapes à venir
* rendez-vous
* praticiens rencontrés
* suivis recommandés
* objectif sportif

---

## Rendez-vous

Le patient peut consulter :

* prochaines séances
* historique des consultations
* praticiens rencontrés

---

## Questionnaire préalable

Le patient peut :

* remplir le questionnaire
* consulter ses réponses
* modifier ses réponses

---

## Coffre-fort documentaire

Le patient peut retrouver :

* ordonnances
* recommandations
* comptes rendus
* documents transmis par les praticiens

---

## To-do list intelligente

Le patient possède une to-do list spécialisée selon son objectif sportif.

Exemples :

* prendre rendez-vous chez un kiné
* effectuer un contrôle médical
* suivre une recommandation nutritionnelle
* compléter une étape de préparation

Cette liste peut être :

* créée manuellement
* générée automatiquement via les notes praticien
* générée via automatisations/IA

---

# Liaison praticien ↔ patient

Cette partie est centrale dans le MVP.

Les deux interfaces doivent communiquer entre elles.

---

## Synchronisation des données

Les actions réalisées dans une interface mettent automatiquement à jour l’autre interface.

Exemples :

* rendez-vous terminé
* étape validée
* nouvelle recommandation
* nouveau document

---

## Notes praticien → actions patient

Les notes praticien peuvent générer automatiquement :

* des tâches
* des suivis
* des recommandations
* des relances

Exemple :

* note praticien :
  “Douleur musculaire persistante, recommander un kiné”

→ génération automatique :

* “Prendre rendez-vous chez un kinésithérapeute”

---

## Réponses patient → alertes praticien

Le patient peut répondre :

* aux relances
* aux suivis
* aux questions automatiques

Ces réponses remontent ensuite côté praticien.

Exemple :

* “J’ai encore mal au mollet”
  → notification praticien
  → suggestion automatique de suivi

---

# Automatisations et IA

Les automatisations sont considérées comme une partie importante de la vision produit.

Le but est de maintenir :

* un suivi actif
* une continuité entre les consultations
* une communication fluide

---

# Relances automatiques

Le système peut envoyer :

* WhatsApp
* SMS
* email
* notifications

Exemples de relances :

* « Vous êtes à un mois de votre marathon, comment vous sentez-vous ? »
* « Avez-vous encore des douleurs musculaires ? »
* « Avez-vous pu consulter le kinésithérapeute recommandé ? »
* « Souhaitez-vous programmer un rendez-vous de suivi ? »

---

# IA d’assistance

L’IA doit être pensée comme une IA d’assistance.

Elle ne remplace pas les praticiens.

Elle peut permettre :

* analyse des notes praticien
* génération automatique de tâches
* suggestions automatiques de suivi
* détection de suivis manquants
* génération d’alertes
* aide à la priorisation des patients nécessitant une attention particulière

Le projet envisage potentiellement :

* utilisation d’un LLM
* automatisations intelligentes
* logique ML/Python si pertinent

Le choix exact reste ouvert.

---

# Design system professionnel — PrépaMarathon

Le MVP doit reprendre l’identité visuelle existante du site PrépaMarathon.

L’objectif n’est pas de créer une nouvelle direction artistique, mais de prolonger l’expérience actuelle dans une application produit.

Le design doit donner l’impression que l’application appartient au même écosystème que le site public.

Les valeurs visuelles à conserver :

* premium mais accessible ;
* sportif mais médicalement rassurant ;
* humain, clair, chaleureux ;
* moderne mais pas froid ;
* très lisible ;
* orienté accompagnement.

---

## 1. Palette de couleurs

Les couleurs suivantes sont extraites/estimées à partir de la capture du site PrépaMarathon.

### Couleurs principales

| Usage                 |       Couleur |                    Hex |
| --------------------- | ------------: | ---------------------: |
| Fond principal crème  |   Crème clair |              `#F8F5F1` |
| Fond secondaire beige |    Beige doux |              `#F5EFE9` |
| Accent principal      | Orange corail |              `#E86F47` |
| Accent hover          |  Orange foncé |              `#D85F38` |
| Accent clair          | Orange pastel |              `#F3B9A4` |
| Texte principal       |     Noir doux |              `#242525` |
| Texte secondaire      |    Gris chaud |              `#75716C` |
| Texte tertiaire       |    Gris clair |              `#9B9591` |
| Bordures              |    Beige-gris |              `#DFDDD9` |
| Cartes                |   Blanc chaud | `#FFFFFF` ou `#FBF8F4` |
| Fond footer           |  Noir charbon |              `#242424` |

### Variables recommandées

```css
:root {
  --color-background: #F8F5F1;
  --color-background-soft: #F5EFE9;
  --color-surface: #FFFFFF;
  --color-surface-warm: #FBF8F4;

  --color-primary: #E86F47;
  --color-primary-hover: #D85F38;
  --color-primary-soft: #F3B9A4;
  --color-primary-bg: #FCE9E1;

  --color-text: #242525;
  --color-text-muted: #75716C;
  --color-text-light: #9B9591;

  --color-border: #DFDDD9;
  --color-footer: #242424;

  --color-success: #4F8A5B;
  --color-warning: #E6A23C;
  --color-danger: #D9534F;
  --color-info: #5A7D9A;
}
```

### Règles d’usage couleur

* Le fond principal doit rester crème/beige, jamais blanc pur sur toute la page.
* L’orange corail doit être réservé aux actions importantes, statuts actifs, icônes et accents.
* Le noir doit être légèrement adouci, pas un `#000000` pur.
* Les gris doivent être chauds, pas bleutés.
* Les cartes doivent rester très claires, avec bordures discrètes.

---

## 2. Typographie

Le site utilise une combinaison visuelle forte :

* gros titres très impactants ;
* mots émotionnels en italique/script orange ;
* textes secondaires courts et doux.

### Recommandation typographique

Si possible :

* titres : une police très ronde, bold, moderne ;
* texte : une sans-serif lisible ;
* accent italique : une serif italique ou script élégante.

Exemples de stacks possibles :

```css
--font-heading: "Inter", "Manrope", "Satoshi", system-ui, sans-serif;
--font-body: "Inter", "Manrope", system-ui, sans-serif;
--font-accent: "Georgia", "Cormorant Garamond", serif;
```

### Échelle typographique recommandée

| Élément                | Taille desktop | Taille mobile |         Poids |
| ---------------------- | -------------: | ------------: | ------------: |
| Hero / titre principal |        56–72px |       36–44px |       800/900 |
| H1 app                 |        40–48px |       30–36px |           800 |
| H2                     |        30–36px |       24–28px |           800 |
| H3                     |        22–26px |       20–22px |           700 |
| Body                   |        15–16px |       14–16px |       400/500 |
| Small                  |        12–13px |          12px |           500 |
| Badge / label          |        10–12px |       10–12px | 700 uppercase |

### Style des titres

Les titres doivent être :

* courts ;
* très lisibles ;
* humains ;
* orientés bénéfice.

Exemples de ton :

* “Suivi médical global”
* “Votre préparation, sans angle mort”
* “Actions à faire avant la course”
* “Patients à suivre en priorité”

---

## 3. Border radius

Le site utilise des formes arrondies mais pas excessivement “bubbly”.

### Tokens radius

```css
--radius-xs: 6px;
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-full: 999px;
```

### Usage recommandé

| Composant        |          Radius |
| ---------------- | --------------: |
| Boutons          | `10px` à `14px` |
| Badges           |         `999px` |
| Inputs           |          `12px` |
| Cartes dashboard | `18px` à `24px` |
| Modales          |          `24px` |
| Photos / mockups | `18px` à `24px` |
| Timeline items   | `12px` à `16px` |

---

## 4. Ombres

Les ombres doivent être douces, premium et discrètes.

Éviter les ombres dures ou trop SaaS.

```css
--shadow-sm: 0 4px 12px rgba(36, 37, 37, 0.06);
--shadow-md: 0 12px 32px rgba(36, 37, 37, 0.10);
--shadow-lg: 0 24px 60px rgba(36, 37, 37, 0.14);
```

Usage :

* cartes simples : `shadow-sm` ;
* fiches patient importantes : `shadow-md` ;
* éléments flottants / mockups / modales : `shadow-lg`.

---

## 5. Spacing / Layout

Le site est très respirant.

Le MVP doit conserver cette logique :

* beaucoup d’espace ;
* peu de densité inutile ;
* hiérarchie claire.

### Spacing scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### Layout recommandé

* largeur max desktop : `1120px` à `1200px` ;
* padding page desktop : `32px` à `48px` ;
* padding page mobile : `20px` ;
* gap cartes : `20px` à `24px` ;
* padding carte : `20px` à `28px`.

---

## 6. Composants UI

### Boutons primaires

Style :

* fond orange corail ;
* texte blanc ;
* radius moyen ;
* padding généreux ;
* poids typographique fort.

```css
.button-primary {
  background: #E86F47;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(232, 111, 71, 0.24);
}

.button-primary:hover {
  background: #D85F38;
}
```

### Boutons secondaires

```css
.button-secondary {
  background: #FFFFFF;
  color: #242525;
  border: 1px solid #DFDDD9;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
}
```

### Boutons sombres / CTA forts

Utiliser pour les CTA importants type footer ou action finale.

```css
.button-dark {
  background: #242525;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 14px 22px;
  font-weight: 800;
}
```

---

## 7. Cartes

Les cartes sont centrales dans le design.

Elles doivent être :

* claires ;
* arrondies ;
* légèrement ombrées ;
* avec bordure subtile.

```css
.card {
  background: #FFFFFF;
  border: 1px solid #DFDDD9;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(36, 37, 37, 0.06);
}
```

Variantes :

* carte patient ;
* carte rendez-vous ;
* carte alerte ;
* carte document ;
* carte tâche ;
* carte étape de parcours.

---

## 8. Badges et statuts

Les badges doivent permettre une lecture rapide sans agresser visuellement.

### Exemples

| Statut    |      Fond |     Texte |
| --------- | --------: | --------: |
| En cours  | `#FCE9E1` | `#E86F47` |
| Réalisé   | `#E8F3EA` | `#4F8A5B` |
| À venir   | `#F5EFE9` | `#75716C` |
| Attention | `#FFF3D8` | `#B7791F` |
| Risque    | `#FBE3E1` | `#D9534F` |

```css
.badge {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

---

## 9. Timeline de parcours

Le site public met déjà en avant une chronologie du parcours.

Cette logique doit être reprise dans l’application.

### Usage

Côté praticien :

* timeline détaillée du parcours ;
* étapes réalisées/en cours/à venir ;
* recommandations associées ;
* praticien responsable ;
* notes liées.

Côté patient :

* timeline simplifiée ;
* progression lisible ;
* prochaines étapes ;
* CTA direct si action nécessaire.

### Style recommandé

* ligne verticale fine `#DFDDD9` ;
* icônes rondes orange ;
* cartes d’étapes blanches ;
* état actif en orange doux ;
* état réalisé en vert doux ;
* état à venir en beige/gris.

---

## 10. Inputs / formulaires

Le questionnaire médical doit être agréable à remplir.

Style recommandé :

```css
.input {
  background: #FFFFFF;
  border: 1px solid #DFDDD9;
  border-radius: 12px;
  padding: 12px 14px;
  color: #242525;
}

.input:focus {
  border-color: #E86F47;
  box-shadow: 0 0 0 3px rgba(232, 111, 71, 0.16);
}
```

Les formulaires doivent être découpés par sections :

* informations personnelles ;
* santé cardiovasculaire ;
* santé respiratoire ;
* musculo-squelettique ;
* nutrition/hydratation ;
* sommeil/récupération ;
* relation à la course.

Ne pas afficher tout le questionnaire en un bloc massif.

---

## 11. Icônes

Style :

* icônes fines ;
* line icons ;
* couleur orange corail ;
* taille 18–24px.

Librairie possible :

* Lucide ;
* Phosphor Icons ;
* Heroicons.

À privilégier :

* coeur / santé ;
* calendrier ;
* document ;
* checklist ;
* alerte ;
* running ;
* message ;
* utilisateur ;
* stéthoscope si disponible.

---

## 12. Design côté praticien

L’interface praticien peut être plus dense, mais elle doit rester premium et claire.

À construire :

* sidebar ou top navigation sobre ;
* dashboard en cartes ;
* liste de patients avec statuts ;
* filtres en chips ;
* fiche patient multicouche ;
* timeline de parcours ;
* bloc questionnaire ;
* bloc notes ;
* bloc alertes.

### Éviter

* tableaux trop froids ;
* back-office générique ;
* design hospitalier ;
* surcharge d’informations.

---

## 13. Design côté patient

L’interface patient doit être très guidée.

À construire :

* page d’accueil simple ;
* progression visuelle ;
* prochaine étape évidente ;
* to-do list ;
* relances/réponses ;
* rendez-vous ;
* documents.

Elle doit ressembler à :

* un compagnon de préparation ;
* une app de suivi sportif/médical ;
* une expérience rassurante.

---

## 14. Ton rédactionnel

Le wording doit être simple, humain et rassurant.

À privilégier :

* phrases courtes ;
* bénéfice clair ;
* pas de jargon médical inutile ;
* pas de ton alarmiste.

Exemples :

* “Votre prochaine étape”
* “À faire avant votre course”
* “Un praticien vous recommande ce suivi”
* “Votre douleur est-elle toujours présente ?”
* “Votre préparation avance bien”

---

## 15. Responsive

L’application doit être responsive.

Priorité :

* desktop/tablette pour praticien ;
* mobile-first pour patient.

Côté patient, l’expérience doit très bien fonctionner sur mobile.

Côté praticien, le desktop est prioritaire.

---

## 16. Résumé design à respecter absolument

À respecter :

* fond crème `#F8F5F1` ;
* accent orange `#E86F47` ;
* texte noir doux `#242525` ;
* cartes blanches arrondies ;
* radius 12–24px ;
* ombres douces ;
* interface aérée ;
* timeline de parcours ;
* badges doux ;
* ton humain ;
* design premium accessible.

À éviter :

* blanc pur partout ;
* bleu SaaS générique ;
* design médical froid ;
* tableaux trop denses ;
* composants carrés ;
* noir pur ;
* surcharge visuelle.

---

# UX / Produit — éléments importants

Le MVP doit donner une impression :

* fluide ;
* moderne ;
* claire ;
* crédible ;
* orientée suivi humain.

Le produit doit éviter une sensation :

* trop administrative ;
* trop médicale ;
* trop “back-office froid”.

L’expérience doit plutôt rappeler :

* un outil de coordination vivant ;
* un compagnon de suivi sportif ;
* une plateforme moderne de suivi patient.

---

# Données fictives et démonstration

Le MVP doit être démontrable avec de faux profils patients réalistes.

Les données mockées sont très importantes.

Il faut créer plusieurs profils crédibles avec :

* blessures ;
* douleurs ;
* fatigue ;
* différents objectifs sportifs ;
* différents suivis ;
* historiques cohérents.

Exemples :

* marathonien avec douleur au mollet ;
* coureur avec fatigue chronique ;
* patient avec antécédents cardiaques ;
* coureur nécessitant un suivi kiné renforcé ;
* patient avec mauvaise récupération.

L’objectif est que le produit semble réaliste immédiatement.

---

# Architecture produit importante

Le produit doit être pensé de manière suffisamment flexible pour :

* gérer plusieurs types de parcours sportifs ;
* gérer plusieurs praticiens ;
* faire évoluer les parcours ;
* ajouter de nouvelles automatisations.

Même si le MVP reste centré sur PrépaMarathon.

---

# Contraintes et choix techniques

L’objectif est de laisser une liberté importante sur les choix techniques.

Cependant, certaines orientations sont souhaitées.

---

# Stack technique souhaitée (ouverte)

## Base de données / backend

* Supabase souhaité

Utilisation possible :

* auth
* database
* storage
* realtime
* edge functions

---

## IA / automatisations

Possibilité envisagée :

* Gemini
* LLM externe
* Python pour logique ML/automatisation

Le choix exact reste libre.

---

# Liberté technique importante

Le développeur garde une liberté importante sur :

* frontend ;
* architecture ;
* structure applicative ;
* organisation du code ;
* choix exact des frameworks.

Cependant certaines orientations sont fortement souhaitées.

---

# Important

Le projet ne doit pas être pensé comme :

* un simple CRUD médical
* ou une simple app de rendez-vous.

Le cœur du produit est :

* la coordination
* la continuité du suivi
* les automatisations
* la circulation des informations
* et la visibilité globale du patient avant sa course.

---

# Vision IA importante

L’IA ne doit PAS être pensée comme :

* une IA qui remplace les praticiens ;
* un diagnostic médical automatique.

L’IA doit surtout servir :

* d’assistant ;
* d’automatisation intelligente ;
* d’aide organisationnelle ;
* d’aide au suivi.

Exemples :

* analyser une note praticien ;
* détecter une recommandation ;
* générer une tâche patient ;
* générer une relance ;
* identifier un suivi manquant.

---

# Ce qu’il faut privilégier

Priorités importantes :

* UX claire
* démonstration fluide
* architecture propre
* cohérence des données
* parcours crédibles
* expérience réaliste
* liaison forte entre patient et praticien
* automatisations visibles

---

# Ce qu’il faut éviter

* Overengineering inutile
* Fonctionnalités trop médicales complexes
* Trop de complexité réglementaire
* IA trop opaque
* Architecture disproportionnée pour un MVP

---

# Objectif final

Créer un MVP crédible, démontrable et cohérent permettant de montrer :

* la coordination des praticiens
* le suivi intelligent du patient
* la centralisation des informations
* les automatisations
* et la continuité du parcours sportif et médical avant une course.
