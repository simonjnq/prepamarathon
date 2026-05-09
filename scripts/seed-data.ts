/**
 * PrépaMarathon — seed data definitions.
 * Today is anchored at 2026-05-09 to keep the demo coherent.
 */

export const TODAY = new Date("2026-05-09T10:00:00Z");

export function isoDate(daysOffset: number): string {
  const d = new Date(TODAY.getTime() + daysOffset * 86400000);
  return d.toISOString().slice(0, 10);
}

export function isoDateTime(
  daysOffset: number,
  hour: number,
  minute = 0,
): string {
  const d = new Date(TODAY.getTime() + daysOffset * 86400000);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ---------------- PRACTITIONERS ----------------
export type PractitionerSeed = {
  username: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty:
    | "medecin_du_sport"
    | "kinesitherapeute"
    | "osteopathe"
    | "nutritionniste"
    | "podologue"
    | "cardiologue"
    | "psychologue"
    | "coach";
  bio: string;
  cabinet: string;
  city: string;
  yearsExperience: number;
  rpps: string;
  phone: string;
};

export const practitioners: PractitionerSeed[] = [
  {
    username: "laurent.medecindusport",
    firstName: "Hélène",
    lastName: "Laurent",
    title: "Dr",
    specialty: "medecin_du_sport",
    bio: "Médecin du sport spécialisée dans la préparation des coureurs amateurs. 14 ans de pratique, marathonienne elle-même.",
    cabinet: "Cabinet Vélodrome",
    city: "Paris 11e",
    yearsExperience: 14,
    rpps: "10100123456",
    phone: "+33 1 42 11 22 01",
  },
  {
    username: "dupont.kine",
    firstName: "Pierre",
    lastName: "Dupont",
    title: "M.",
    specialty: "kinesitherapeute",
    bio: "Kinésithérapeute du sport, spécialiste course à pied et chaîne posturale. Anciennement préparateur physique en club.",
    cabinet: "Kiné Sport Bastille",
    city: "Paris 11e",
    yearsExperience: 11,
    rpps: "10100234567",
    phone: "+33 1 42 11 22 02",
  },
  {
    username: "mercier.osteo",
    firstName: "Claire",
    lastName: "Mercier",
    title: "Mme",
    specialty: "osteopathe",
    bio: "Ostéopathe D.O., approche globale du coureur. Travaille avec plusieurs clubs d'athlétisme franciliens.",
    cabinet: "Ostéopathie République",
    city: "Paris 3e",
    yearsExperience: 9,
    rpps: "10100345678",
    phone: "+33 1 42 11 22 03",
  },
  {
    username: "fontaine.nutritionniste",
    firstName: "Marc",
    lastName: "Fontaine",
    title: "M.",
    specialty: "nutritionniste",
    bio: "Diététicien-nutritionniste agréé. Spécialisé en nutrition de l'effort, plans personnalisés pour coureurs longue distance.",
    cabinet: "Nutrition & Performance",
    city: "Paris 9e",
    yearsExperience: 7,
    rpps: "10100456789",
    phone: "+33 1 42 11 22 04",
  },
  {
    username: "girard.podologue",
    firstName: "Anne",
    lastName: "Girard",
    title: "Mme",
    specialty: "podologue",
    bio: "Podologue du sport, conception de semelles orthopédiques sur mesure pour coureurs.",
    cabinet: "Podologie du Marais",
    city: "Paris 4e",
    yearsExperience: 12,
    rpps: "10100567890",
    phone: "+33 1 42 11 22 05",
  },
];

// ---------------- PATIENTS ----------------
export type StepSeed = {
  order: number;
  title: string;
  description?: string;
  category:
    | "medical"
    | "kine"
    | "osteo"
    | "nutrition"
    | "training"
    | "control"
    | "podologie"
    | "cardio"
    | "mental";
  status: "done" | "in_progress" | "upcoming";
  practitioner?: string;
  scheduledOffset?: number;
  completedOffset?: number;
};

export type AppointmentSeed = {
  practitioner: string;
  daysOffset: number;
  hour: number;
  minute?: number;
  duration: number;
  location: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  reason: string;
  summary?: string;
};

export type NoteSeed = {
  practitioner: string;
  appointmentIdx?: number;
  content: string;
  tags?: string[];
  daysOffset: number;
};

export type TaskSeed = {
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done" | "snoozed";
  source: "practitioner" | "system" | "patient" | "ai";
  sourcePractitioner?: string;
  dueOffset?: number;
  completedOffset?: number;
};

export type AlertSeed = {
  severity: "info" | "warning" | "urgent";
  title: string;
  message: string;
  source?: string;
  resolvedOffset?: number;
  daysOffset: number;
};

export type PainSeed = {
  bodyZone: string;
  severity: number;
  description?: string;
  startedOffset: number;
  resolvedOffset?: number;
};

export type QResponseSeed = {
  section: string;
  key: string;
  label: string;
  answer: string;
};

export type AssignmentSeed = {
  practitioner: string;
  role: string;
  startedOffset: number;
};

export type PatientSeed = {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  gender: "F" | "M";
  height: number;
  weight: number;
  bloodType?: string;
  occupation: string;
  allergies?: string;
  medications?: string;
  emergencyName: string;
  emergencyPhone: string;
  bio?: string;
  journey: {
    sportGoal:
      | "marathon"
      | "semi_marathon"
      | "10km"
      | "5km"
      | "running"
      | "reprise";
    raceName: string;
    raceDate: string;
    status: "active" | "completed" | "paused";
    currentStepLabel: string;
    progressPct: number;
    weeksToRace: number;
    startedDaysAgo: number;
  };
  steps: StepSeed[];
  assignments: AssignmentSeed[];
  appointments: AppointmentSeed[];
  notes: NoteSeed[];
  tasks: TaskSeed[];
  alerts: AlertSeed[];
  pains: PainSeed[];
  questionnaire: QResponseSeed[];
};

const baseQuestionnaire = (overrides: Partial<Record<string, string>>): QResponseSeed[] => {
  const defaults: Record<string, { section: string; label: string; answer: string }> = {
    cardiac_history: {
      section: "Santé cardiovasculaire",
      label: "Avez-vous des antécédents cardiaques personnels ?",
      answer: "Non",
    },
    cardiac_family: {
      section: "Santé cardiovasculaire",
      label: "Antécédents cardiaques familiaux ?",
      answer: "Non",
    },
    hypertension: {
      section: "Santé cardiovasculaire",
      label: "Hypertension artérielle ?",
      answer: "Non",
    },
    asthma: {
      section: "Santé respiratoire",
      label: "Asthme ou difficultés respiratoires à l'effort ?",
      answer: "Non",
    },
    pain_current: {
      section: "Musculo-squelettique",
      label: "Avez-vous une douleur actuelle ?",
      answer: "Non",
    },
    injuries_past: {
      section: "Musculo-squelettique",
      label: "Blessures dans les 12 derniers mois ?",
      answer: "Non",
    },
    sleep_quality: {
      section: "Sommeil & récupération",
      label: "Qualité du sommeil sur 10",
      answer: "7/10",
    },
    nutrition_balance: {
      section: "Nutrition",
      label: "Comment décririez-vous votre alimentation ?",
      answer: "Équilibrée, 3 repas principaux + 1 collation",
    },
    hydration: {
      section: "Nutrition",
      label: "Litres d'eau bus en moyenne par jour",
      answer: "1.5 L",
    },
    weekly_volume: {
      section: "Charge d'entraînement",
      label: "Kilomètres courus par semaine actuellement",
      answer: "30 km",
    },
    motivation: {
      section: "Mental",
      label: "Motivation pour la course (1-10)",
      answer: "9/10",
    },
    fears: {
      section: "Mental",
      label: "Principale appréhension",
      answer: "Ne pas terminer dans le temps visé",
    },
  };
  return Object.entries(defaults).map(([key, v]) => ({
    section: v.section,
    key,
    label: v.label,
    answer: overrides[key] ?? v.answer,
  }));
};

export const patients: PatientSeed[] = [
  // -------------------- 1. MARIE DUBOIS --------------------
  {
    username: "marie.dubois",
    firstName: "Marie",
    lastName: "Dubois",
    phone: "+33 6 12 34 56 01",
    dob: "1991-03-12",
    gender: "F",
    height: 167,
    weight: 58,
    bloodType: "A+",
    occupation: "Chargée de communication",
    allergies: "Pollens (rhinite saisonnière)",
    medications: "Aucun",
    emergencyName: "Pierre Dubois",
    emergencyPhone: "+33 6 12 34 56 99",
    bio: "Court depuis 5 ans, premier marathon il y a 2 ans (Paris, 4h12).",
    journey: {
      sportGoal: "marathon",
      raceName: "Marathon de Berlin 2026",
      raceDate: "2026-09-27",
      status: "active",
      currentStepLabel: "Suivi kiné — chaîne postérieure",
      progressPct: 35,
      weeksToRace: 20,
      startedDaysAgo: 60,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -55, completedOffset: -55 },
      { order: 2, title: "Test d'effort cardiologique", category: "cardio", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -45, completedOffset: -45 },
      { order: 3, title: "Bilan podologique", category: "podologie", status: "done", practitioner: "girard.podologue", scheduledOffset: -38, completedOffset: -38 },
      { order: 4, title: "Plan nutritionnel personnalisé", category: "nutrition", status: "done", practitioner: "fontaine.nutritionniste", scheduledOffset: -30, completedOffset: -30 },
      { order: 5, title: "Suivi kiné — chaîne postérieure", category: "kine", status: "in_progress", practitioner: "dupont.kine", scheduledOffset: -7 },
      { order: 6, title: "Séance ostéopathie de réajustement", category: "osteo", status: "upcoming", practitioner: "mercier.osteo", scheduledOffset: 14 },
      { order: 7, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 45 },
      { order: 8, title: "Préparation mentale dernière ligne", category: "mental", status: "upcoming", scheduledOffset: 110 },
      { order: 9, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 130 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente du parcours", startedOffset: -60 },
      { practitioner: "dupont.kine", role: "Suivi kiné régulier", startedOffset: -25 },
      { practitioner: "mercier.osteo", role: "Réajustements posturaux", startedOffset: -20 },
      { practitioner: "girard.podologue", role: "Bilan podologique unique", startedOffset: -38 },
      { practitioner: "fontaine.nutritionniste", role: "Plan nutritionnel", startedOffset: -30 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -55, hour: 10, duration: 45, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial", summary: "État général bon, autorisée à reprendre la prépa marathon. Test d'effort à programmer." },
      { practitioner: "dupont.kine", daysOffset: -25, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "completed", reason: "Premier bilan kiné", summary: "Tension chaîne postérieure droite. 6 séances prescrites." },
      { practitioner: "dupont.kine", daysOffset: -7, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "completed", reason: "Suivi mollet", summary: "Amélioration nette, douleur 4/10 → 2/10. Continuer étirements." },
      { practitioner: "dupont.kine", daysOffset: 6, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "scheduled", reason: "Suivi mollet" },
      { practitioner: "mercier.osteo", daysOffset: 14, hour: 14, duration: 60, location: "Ostéopathie République", status: "scheduled", reason: "Réajustement bassin/chaîne post." },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -55, content: "Patiente en bonne condition générale, IMC 20.8. Pas de contre-indication. Recommander test d'effort + bilan podologique. Augmenter progressivement le volume hebdo (max +10% par semaine).", tags: ["bilan_initial", "marathon"] },
      { practitioner: "dupont.kine", appointmentIdx: 1, daysOffset: -25, content: "Chaîne postérieure droite tendue. Probable cause : reprise rapide après pause hiver. Traitement : étirements quotidiens, massages tissus profonds, renforcement excentrique mollets.", tags: ["mollet", "chaine_posterieure"] },
      { practitioner: "dupont.kine", appointmentIdx: 2, daysOffset: -7, content: "Bonne évolution. Recommander RDV podologie pour vérifier appui. Si douleur réapparaît à >5/10, stopper la course pendant 5 jours.", tags: ["mollet", "amelioration"] },
    ],
    tasks: [
      { title: "Étirements chaîne postérieure (3x/jour)", description: "10 minutes, après échauffement et après douche. Insister sur ischio + mollets.", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 0 },
      { title: "Reprendre rendez-vous chez le podologue", description: "Suite à la recommandation kiné — vérifier l'appui plantaire droit.", status: "pending", source: "ai", sourcePractitioner: "dupont.kine", dueOffset: 7 },
      { title: "Bain froid après sorties longues > 15 km", status: "pending", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 21 },
      { title: "Compléter le journal de douleur quotidien", status: "in_progress", source: "system", dueOffset: 0 },
      { title: "Test d'effort cardiologique annuel", status: "done", source: "practitioner", sourcePractitioner: "laurent.medecindusport", completedOffset: -45 },
    ],
    alerts: [
      { severity: "warning", title: "Douleur mollet droit persistante", message: "La douleur 4/10 persiste depuis 3 semaines. Suivi kiné en cours. Surveiller volume hebdo.", source: "system", daysOffset: -10, resolvedOffset: -7 },
      { severity: "info", title: "RDV podologue à programmer", message: "Recommandation suite au dernier bilan kiné.", source: "ai", daysOffset: -6 },
    ],
    pains: [
      { bodyZone: "Mollet droit", severity: 3, description: "Tension chaîne postérieure, en amélioration sous suivi kiné.", startedOffset: -28 },
    ],
    questionnaire: baseQuestionnaire({
      pain_current: "Oui — mollet droit (4/10)",
      injuries_past: "Tendinite mollet droit il y a 2 ans, résolue.",
      weekly_volume: "45 km",
      sleep_quality: "8/10",
    }),
  },

  // -------------------- 2. THOMAS LEFEBVRE --------------------
  {
    username: "thomas.lefebvre",
    firstName: "Thomas",
    lastName: "Lefebvre",
    phone: "+33 6 12 34 56 02",
    dob: "1979-11-04",
    gender: "M",
    height: 178,
    weight: 82,
    bloodType: "O+",
    occupation: "Consultant en stratégie",
    allergies: "Aucune connue",
    medications: "Amlor 5mg/j (HTA légère)",
    emergencyName: "Sylvie Lefebvre",
    emergencyPhone: "+33 6 12 34 56 98",
    bio: "Antécédents familiaux : père infarctus à 58 ans. HTA légère contrôlée depuis 4 ans.",
    journey: {
      sportGoal: "semi_marathon",
      raceName: "Semi-marathon de Paris 2026",
      raceDate: "2026-09-13",
      status: "active",
      currentStepLabel: "Test d'effort cardiologique à programmer",
      progressPct: 28,
      weeksToRace: 18,
      startedDaysAgo: 50,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -45, completedOffset: -45 },
      { order: 2, title: "Test d'effort cardiologique", category: "cardio", status: "in_progress", practitioner: "laurent.medecindusport", scheduledOffset: 4 },
      { order: 3, title: "Plan nutritionnel & gestion poids", category: "nutrition", status: "done", practitioner: "fontaine.nutritionniste", scheduledOffset: -25, completedOffset: -25 },
      { order: 4, title: "Suivi tension artérielle hebdomadaire", category: "medical", status: "in_progress", practitioner: "laurent.medecindusport", scheduledOffset: -25 },
      { order: 5, title: "Plan d'entraînement zone 2 dominant", category: "training", status: "in_progress", scheduledOffset: -20 },
      { order: 6, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 50 },
      { order: 7, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 120 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente — suivi cardio", startedOffset: -50 },
      { practitioner: "fontaine.nutritionniste", role: "Plan nutritionnel + perte de poids", startedOffset: -25 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -45, hour: 9, duration: 60, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial + ECG repos", summary: "ECG repos normal. Test d'effort impératif avant montée en charge. FC max théorique cible : <150." },
      { practitioner: "fontaine.nutritionniste", daysOffset: -25, hour: 17, duration: 45, location: "Nutrition & Performance", status: "completed", reason: "Plan nutritionnel & objectif -3 kg", summary: "Réduction sucres rapides, augmentation protéines. Objectif 79 kg avant course." },
      { practitioner: "laurent.medecindusport", daysOffset: 4, hour: 9, duration: 90, location: "Centre cardiologique partenaire — Paris 12e", status: "scheduled", reason: "Test d'effort cardiologique" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -45, content: "Antécédent paternel d'infarctus précoce (58 ans). HTA contrôlée par Amlor 5mg. ECG normal. Imposer test d'effort sous 4 semaines avant intensification. Limiter pic FC à 150 jusqu'à validation.", tags: ["cardio", "hta", "antecedents_familiaux"] },
      { practitioner: "fontaine.nutritionniste", appointmentIdx: 1, daysOffset: -25, content: "IMC 25.9. Cible -3 kg en 16 semaines. Privilégier glucides complexes, réduire sucres ajoutés. Apport hydrique +500 ml/j.", tags: ["nutrition", "perte_de_poids"] },
    ],
    tasks: [
      { title: "Programmer le test d'effort cardiologique", description: "Indispensable avant toute intensification de l'entraînement.", status: "done", source: "practitioner", sourcePractitioner: "laurent.medecindusport", completedOffset: -2 },
      { title: "Mesurer la tension artérielle 2x/jour", description: "Matin et soir, noter dans l'app.", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 0 },
      { title: "Réduire la consommation de pain blanc et boissons sucrées", status: "in_progress", source: "practitioner", sourcePractitioner: "fontaine.nutritionniste", dueOffset: 30 },
      { title: "Sortie longue uniquement en zone 2 (FC<140)", status: "pending", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 90 },
    ],
    alerts: [
      { severity: "urgent", title: "Test d'effort cardiologique non réalisé", message: "Antécédents cardiaques familiaux. Le test d'effort doit avoir lieu avant intensification. RDV le 13/05.", source: "system", daysOffset: -10 },
      { severity: "info", title: "Tension matinale légèrement élevée", message: "Moyenne semaine : 138/86. Surveiller, sans urgence.", source: "system", daysOffset: -3 },
    ],
    pains: [],
    questionnaire: baseQuestionnaire({
      cardiac_history: "HTA légère contrôlée par Amlor 5mg",
      cardiac_family: "Oui — père infarctus à 58 ans",
      hypertension: "Oui — traitée et contrôlée",
      weekly_volume: "25 km",
      motivation: "8/10",
      fears: "Inquiet vis-à-vis du suivi cardio",
      sleep_quality: "6/10",
    }),
  },

  // -------------------- 3. CAMILLE MARTIN --------------------
  {
    username: "camille.martin",
    firstName: "Camille",
    lastName: "Martin",
    phone: "+33 6 12 34 56 03",
    dob: "1995-06-22",
    gender: "F",
    height: 165,
    weight: 56,
    bloodType: "B+",
    occupation: "Professeure de mathématiques",
    allergies: "Aucune",
    medications: "Aucun (B12 prescrit récemment)",
    emergencyName: "Lucie Martin",
    emergencyPhone: "+33 6 12 34 56 97",
    bio: "Premier marathon. Fatigue chronique signalée depuis 2 mois. Bilan biologique en cours.",
    journey: {
      sportGoal: "marathon",
      raceName: "Marathon de Reims 2026",
      raceDate: "2026-10-18",
      status: "active",
      currentStepLabel: "Bilan biologique en attente",
      progressPct: 22,
      weeksToRace: 23,
      startedDaysAgo: 35,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -32, completedOffset: -32 },
      { order: 2, title: "Bilan biologique (NFS, ferritine, B12)", category: "medical", status: "in_progress", practitioner: "laurent.medecindusport", scheduledOffset: -10 },
      { order: 3, title: "Plan nutritionnel adapté à la fatigue", category: "nutrition", status: "in_progress", practitioner: "fontaine.nutritionniste", scheduledOffset: -8 },
      { order: 4, title: "Suivi sommeil (journal 3 semaines)", category: "mental", status: "in_progress", scheduledOffset: -7 },
      { order: 5, title: "Test d'effort si bilan compatible", category: "cardio", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 14 },
      { order: 6, title: "Plan d'entraînement progressif", category: "training", status: "upcoming", scheduledOffset: 21 },
      { order: 7, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 70 },
      { order: 8, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 150 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente", startedOffset: -32 },
      { practitioner: "fontaine.nutritionniste", role: "Plan nutritionnel anti-fatigue", startedOffset: -8 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -32, hour: 11, duration: 60, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial + investigations fatigue", summary: "Fatigue depuis 2 mois, sommeil perturbé. Bilan bio prescrit (NFS, ferritine, vit D, B12, TSH). Suspendre montée en charge tant que bilan non revu." },
      { practitioner: "fontaine.nutritionniste", daysOffset: -8, hour: 18, duration: 45, location: "Nutrition & Performance", status: "completed", reason: "Adaptation nutrition / fatigue", summary: "Apport en fer héminique insuffisant, glucides complexes à augmenter post-entraînement." },
      { practitioner: "laurent.medecindusport", daysOffset: 7, hour: 11, duration: 30, location: "Cabinet Vélodrome — Paris 11e", status: "scheduled", reason: "Restitution bilan biologique" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -32, content: "Fatigue signalée 2 mois. Sommeil 5-6h/nuit, réveils nocturnes. IMC 20.6. Pas d'antécédent particulier. Probable carence (fer ou B12) à confirmer. Pause montée en charge 4 semaines.", tags: ["fatigue", "sommeil", "bilan_bio"] },
      { practitioner: "fontaine.nutritionniste", appointmentIdx: 1, daysOffset: -8, content: "Régime quasi-végétarien, peu de produits riches en fer. Recommander : viandes rouges 1-2x/sem, légumineuses, et collation post-entraînement glucides+protéines. Surveiller récupération.", tags: ["nutrition", "fer", "fatigue"] },
    ],
    tasks: [
      { title: "Faire la prise de sang prescrite", description: "Laboratoire, à jeun. Résultats à transmettre avant RDV du 16/05.", status: "done", source: "practitioner", sourcePractitioner: "laurent.medecindusport", completedOffset: -3 },
      { title: "Tenir un journal de sommeil pendant 3 semaines", description: "Heure de coucher, durée, qualité ressentie.", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 14 },
      { title: "Consommer une source de fer héminique 2x/sem", status: "in_progress", source: "practitioner", sourcePractitioner: "fontaine.nutritionniste", dueOffset: 30 },
      { title: "Pause de la montée en charge — pas d'augmentation kilométrique", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 14 },
    ],
    alerts: [
      { severity: "warning", title: "Fatigue persistante > 8 semaines", message: "Patiente signale fatigue continue. Bilan biologique en cours, à interpréter rapidement.", source: "system", daysOffset: -15 },
      { severity: "info", title: "Sommeil < 6h/nuit en moyenne", message: "Journal de sommeil sur 7 jours : moyenne 5h45.", source: "ai", daysOffset: -2 },
    ],
    pains: [],
    questionnaire: baseQuestionnaire({
      sleep_quality: "4/10",
      weekly_volume: "20 km",
      nutrition_balance: "Quasi-végétarienne, peu de viande rouge",
      motivation: "8/10",
      fears: "Que la fatigue ne passe pas",
    }),
  },

  // -------------------- 4. JULIEN BERNARD --------------------
  {
    username: "julien.bernard",
    firstName: "Julien",
    lastName: "Bernard",
    phone: "+33 6 12 34 56 04",
    dob: "1998-01-15",
    gender: "M",
    height: 182,
    weight: 76,
    bloodType: "A+",
    occupation: "Ingénieur logiciel",
    allergies: "Arachide (modérée)",
    medications: "Aucun",
    emergencyName: "Mathilde Bernard",
    emergencyPhone: "+33 6 12 34 56 96",
    bio: "Profil 'tout ou rien'. Tendance à pousser trop fort en début de prépa.",
    journey: {
      sportGoal: "marathon",
      raceName: "Marathon de La Rochelle 2026",
      raceDate: "2026-11-29",
      status: "active",
      currentStepLabel: "Réajustement charge / récupération",
      progressPct: 18,
      weeksToRace: 29,
      startedDaysAgo: 28,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -25, completedOffset: -25 },
      { order: 2, title: "Bilan kiné préventif", category: "kine", status: "done", practitioner: "dupont.kine", scheduledOffset: -18, completedOffset: -18 },
      { order: 3, title: "Plan nutritionnel pour récupération", category: "nutrition", status: "in_progress", practitioner: "fontaine.nutritionniste", scheduledOffset: -10 },
      { order: 4, title: "Réajustement charge / récupération", category: "training", status: "in_progress", scheduledOffset: -3 },
      { order: 5, title: "Suivi kiné quadriceps", category: "kine", status: "upcoming", practitioner: "dupont.kine", scheduledOffset: 5 },
      { order: 6, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 90 },
      { order: 7, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 190 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente", startedOffset: -25 },
      { practitioner: "dupont.kine", role: "Suivi récupération", startedOffset: -18 },
      { practitioner: "fontaine.nutritionniste", role: "Plan récupération", startedOffset: -10 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -25, hour: 16, duration: 45, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial", summary: "État général excellent. Recommander modération de la montée en charge — tendance à surentraînement." },
      { practitioner: "dupont.kine", daysOffset: -18, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "completed", reason: "Bilan préventif", summary: "Quadriceps gauche tendu, hyperlaxité légère. Étirements + renforcement excentrique." },
      { practitioner: "fontaine.nutritionniste", daysOffset: -10, hour: 17, duration: 45, location: "Nutrition & Performance", status: "completed", reason: "Plan nutrition récupération", summary: "Apport protéique post-effort insuffisant. Cibler 1.6g/kg/j." },
      { practitioner: "dupont.kine", daysOffset: 5, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "scheduled", reason: "Suivi quadriceps gauche" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -25, content: "Jeune sportif motivé mais profil 'tout ou rien'. Insister sur progressivité (+10% max/semaine). Programmer suivi rapproché.", tags: ["surentrainement_risque", "marathon"] },
      { practitioner: "dupont.kine", appointmentIdx: 1, daysOffset: -18, content: "Tension quadriceps gauche, hyperlaxité ligamentaire. Renforcement excentrique 3x/sem. Revoir dans 3 sem.", tags: ["quadriceps", "kine"] },
      { practitioner: "fontaine.nutritionniste", appointmentIdx: 2, daysOffset: -10, content: "Apport protéique post-effort insuffisant (~0.8g/kg). Cibler 1.6g/kg, dont 25-30g dans les 30 min post-séance.", tags: ["nutrition", "recuperation"] },
    ],
    tasks: [
      { title: "Bain froid 8 min après sorties > 12 km", status: "pending", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 7 },
      { title: "Collation protéinée dans les 30 min post-effort", status: "in_progress", source: "practitioner", sourcePractitioner: "fontaine.nutritionniste", dueOffset: 30 },
      { title: "Plafonner la semaine à 50 km maximum", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 14 },
      { title: "Dormir 7h30 minimum 5 nuits/sem", status: "pending", source: "ai", dueOffset: 21 },
    ],
    alerts: [
      { severity: "warning", title: "Charge d'entraînement élevée vs récupération", message: "Volume hebdo 65 km en sem -2 alors que progression recommandée plafonnait à 50 km.", source: "system", daysOffset: -5 },
    ],
    pains: [
      { bodyZone: "Quadriceps gauche", severity: 3, description: "Tension, en suivi kiné.", startedOffset: -22 },
    ],
    questionnaire: baseQuestionnaire({
      pain_current: "Tension quadriceps gauche (3/10)",
      weekly_volume: "55-65 km",
      sleep_quality: "6/10",
      nutrition_balance: "Pas toujours équilibrée — sauts de repas",
      motivation: "10/10",
      fears: "Aucune particulière",
    }),
  },

  // -------------------- 5. SOPHIE PETIT --------------------
  {
    username: "sophie.petit",
    firstName: "Sophie",
    lastName: "Petit",
    phone: "+33 6 12 34 56 05",
    dob: "1985-09-30",
    gender: "F",
    height: 170,
    weight: 64,
    bloodType: "AB+",
    occupation: "Médecin généraliste",
    allergies: "Pénicilline",
    medications: "Aucun",
    emergencyName: "Antoine Petit",
    emergencyPhone: "+33 6 12 34 56 95",
    bio: "Reprise après ligamentoplastie genou droit (juin 2025). Très consciente des risques.",
    journey: {
      sportGoal: "10km",
      raceName: "10km de Paris 2026",
      raceDate: "2026-09-06",
      status: "active",
      currentStepLabel: "Reprise progressive — semaine 12",
      progressPct: 38,
      weeksToRace: 17,
      startedDaysAgo: 75,
    },
    steps: [
      { order: 1, title: "Bilan post-opératoire validé par chirurgien", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -75, completedOffset: -75 },
      { order: 2, title: "Rééducation kiné intensive", category: "kine", status: "done", practitioner: "dupont.kine", scheduledOffset: -70, completedOffset: -20 },
      { order: 3, title: "Bilan ostéopathique global", category: "osteo", status: "done", practitioner: "mercier.osteo", scheduledOffset: -50, completedOffset: -50 },
      { order: 4, title: "Reprise course — protocole progressif", category: "training", status: "in_progress", scheduledOffset: -30 },
      { order: 5, title: "Renforcement chaîne ischio + quadri", category: "kine", status: "in_progress", practitioner: "dupont.kine", scheduledOffset: -15 },
      { order: 6, title: "Contrôle genou mensuel", category: "control", status: "in_progress", practitioner: "laurent.medecindusport", scheduledOffset: -2 },
      { order: 7, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 50 },
      { order: 8, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 110 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente — suivi reprise", startedOffset: -75 },
      { practitioner: "dupont.kine", role: "Rééducation + renforcement", startedOffset: -70 },
      { practitioner: "mercier.osteo", role: "Réajustements globaux", startedOffset: -50 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -75, hour: 10, duration: 60, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan post-opératoire", summary: "Genou stable, mobilité 0-130°. Feu vert reprise course en protocole progressif." },
      { practitioner: "mercier.osteo", daysOffset: -50, hour: 14, duration: 60, location: "Ostéopathie République", status: "completed", reason: "Bilan global", summary: "Chaîne droite sur-sollicitée par compensation. Travail bassin + diaphragme." },
      { practitioner: "dupont.kine", daysOffset: -15, hour: 18, minute: 30, duration: 60, location: "Kiné Sport Bastille", status: "completed", reason: "Suivi rééducation", summary: "Force ischio droit 85% du gauche. Continuer renforcement excentrique 3x/sem." },
      { practitioner: "laurent.medecindusport", daysOffset: -2, hour: 10, duration: 30, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Contrôle genou mensuel", summary: "Pas de douleur, pas d'épanchement. Autorisation course continue 30 min." },
      { practitioner: "dupont.kine", daysOffset: 12, hour: 18, minute: 30, duration: 60, location: "Kiné Sport Bastille", status: "scheduled", reason: "Suivi renforcement" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -75, content: "Ligamentoplastie LCA droit (juin 2025). Récupération complète selon chirurgien. Protocole de reprise course : 4 semaines marche/course alternée puis montée progressive. Surveiller épanchement.", tags: ["reprise", "genou", "lca"] },
      { practitioner: "mercier.osteo", appointmentIdx: 1, daysOffset: -50, content: "Compensation côté droit dominante. Bassin antériorisé. Travail myofascial + respiration diaphragmatique. Revoir 6 sem.", tags: ["bassin", "compensation"] },
      { practitioner: "dupont.kine", appointmentIdx: 2, daysOffset: -15, content: "Force ischio D 85% du G. Continuer Nordic hamstring + presse 1 jambe. Renforcement quadri D ok. Pas reprise pivot avant 3 mois.", tags: ["renforcement", "ischio", "quadriceps"] },
      { practitioner: "laurent.medecindusport", appointmentIdx: 3, daysOffset: -2, content: "Examen genou droit normal. Tests Lachman/tiroir négatifs. Continuer course continue 30 min, monter à 40 min dans 2 sem.", tags: ["controle", "genou"] },
    ],
    tasks: [
      { title: "Renforcement excentrique ischios (Nordic hamstring) 3x/sem", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 30 },
      { title: "Auto-évaluation douleur genou quotidienne (échelle 0-10)", status: "in_progress", source: "system", dueOffset: 0 },
      { title: "Contrôle genou mensuel (prochain : 09/06)", status: "pending", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 30 },
      { title: "Pas de course en descente raide", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 60 },
    ],
    alerts: [
      { severity: "info", title: "Reprise course en cours", message: "Patiente en reprise post-LCA, suivi rapproché ok.", source: "system", daysOffset: -30 },
    ],
    pains: [
      { bodyZone: "Genou droit", severity: 2, description: "Gêne occasionnelle après efforts > 30 min, en amélioration.", startedOffset: -75 },
    ],
    questionnaire: baseQuestionnaire({
      injuries_past: "Rupture LCA genou droit, ligamentoplastie juin 2025",
      pain_current: "Gêne légère genou D (2/10)",
      weekly_volume: "15 km (reprise progressive)",
      motivation: "10/10",
      fears: "Récidive de blessure",
      sleep_quality: "8/10",
    }),
  },

  // -------------------- 6. ANTOINE ROUSSEAU --------------------
  {
    username: "antoine.rousseau",
    firstName: "Antoine",
    lastName: "Rousseau",
    phone: "+33 6 12 34 56 06",
    dob: "1990-04-08",
    gender: "M",
    height: 175,
    weight: 70,
    bloodType: "O+",
    occupation: "Architecte",
    allergies: "Aucune",
    medications: "Aucun",
    emergencyName: "Léa Rousseau",
    emergencyPhone: "+33 6 12 34 56 94",
    bio: "Tendinite achille gauche d'apparition récente (~2 mois). Suivi kiné renforcé.",
    journey: {
      sportGoal: "marathon",
      raceName: "Marathon de Berlin 2026",
      raceDate: "2026-09-27",
      status: "active",
      currentStepLabel: "Suivi kiné renforcé tendon achille",
      progressPct: 42,
      weeksToRace: 20,
      startedDaysAgo: 90,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -85, completedOffset: -85 },
      { order: 2, title: "Bilan podologique + semelles", category: "podologie", status: "done", practitioner: "girard.podologue", scheduledOffset: -70, completedOffset: -50 },
      { order: 3, title: "Suivi kiné tendinite achille", category: "kine", status: "in_progress", practitioner: "dupont.kine", scheduledOffset: -45 },
      { order: 4, title: "Séances ostéo réajustement chaîne post.", category: "osteo", status: "in_progress", practitioner: "mercier.osteo", scheduledOffset: -30 },
      { order: 5, title: "Plan nutritionnel performance", category: "nutrition", status: "done", practitioner: "fontaine.nutritionniste", scheduledOffset: -60, completedOffset: -60 },
      { order: 6, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 30 },
      { order: 7, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 130 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente", startedOffset: -85 },
      { practitioner: "dupont.kine", role: "Kiné renforcé tendon achille", startedOffset: -45 },
      { practitioner: "mercier.osteo", role: "Réajustements chaîne post.", startedOffset: -30 },
      { practitioner: "girard.podologue", role: "Semelles correctrices", startedOffset: -70 },
      { practitioner: "fontaine.nutritionniste", role: "Plan performance", startedOffset: -60 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -85, hour: 9, duration: 60, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial marathon", summary: "Coureur expérimenté (3e marathon). RAS en initial." },
      { practitioner: "girard.podologue", daysOffset: -70, hour: 11, duration: 60, location: "Podologie du Marais", status: "completed", reason: "Bilan podologique", summary: "Pronation excessive pied gauche. Semelles correctrices commandées." },
      { practitioner: "fontaine.nutritionniste", daysOffset: -60, hour: 18, duration: 45, location: "Nutrition & Performance", status: "completed", reason: "Plan nutritionnel", summary: "Plan structuré, apport calorique 2800 kcal/j sur semaines de gros volume." },
      { practitioner: "dupont.kine", daysOffset: -45, hour: 18, minute: 30, duration: 60, location: "Kiné Sport Bastille", status: "completed", reason: "Tendinite achille gauche", summary: "Tendinite achille débutante. Protocole HSR + glaçage. 8 séances." },
      { practitioner: "dupont.kine", daysOffset: -25, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "completed", reason: "Suivi tendinite", summary: "Amélioration nette, douleur 6/10 → 3/10. Continuer." },
      { practitioner: "mercier.osteo", daysOffset: -30, hour: 14, duration: 60, location: "Ostéopathie République", status: "completed", reason: "Réajustement chaîne post.", summary: "Bassin gauche rotatoire, mollet gauche tendu en compensation. Travail manuel ciblé." },
      { practitioner: "dupont.kine", daysOffset: 8, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "scheduled", reason: "Suivi tendon achille" },
      { practitioner: "mercier.osteo", daysOffset: 21, hour: 14, duration: 60, location: "Ostéopathie République", status: "scheduled", reason: "Suivi global" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -85, content: "3e marathon (Paris 3h45, Berlin 3h38). Profil endurant, peu de blessures. RAS bilan initial.", tags: ["bilan_initial", "experimenté"] },
      { practitioner: "girard.podologue", appointmentIdx: 1, daysOffset: -70, content: "Pronation excessive pied gauche, voûte plantaire affaissée. Semelles correctrices CAD/CAM commandées (livraison 3 sem). Possible cause de la tendinite achille.", tags: ["podologie", "pronation"] },
      { practitioner: "dupont.kine", appointmentIdx: 3, daysOffset: -45, content: "Tendinite corps tendon achille G. Probable lien pronation excessive. Protocole HSR (Heavy Slow Resistance) 3x/sem + glaçage 3x/jour. 8 séances prévues.", tags: ["achille", "tendinite", "hsr"] },
      { practitioner: "dupont.kine", appointmentIdx: 4, daysOffset: -25, content: "Bonne réponse HSR. Douleur 3/10. Continuer protocole, ajouter sauts pliométriques légers à partir sem prochaine.", tags: ["achille", "amelioration"] },
      { practitioner: "mercier.osteo", appointmentIdx: 5, daysOffset: -30, content: "Bassin gauche en rotation antérieure. Mollet G hypertonique en compensation. Travail manuel sur fascia + correction respiration thoracique haute. Revoir 4 sem.", tags: ["bassin", "compensation"] },
    ],
    tasks: [
      { title: "Étirements + glaçage achille gauche (3x/jour)", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 14 },
      { title: "Porter les semelles podologiques en permanence", status: "in_progress", source: "practitioner", sourcePractitioner: "girard.podologue", dueOffset: 90 },
      { title: "HSR mollets — 3x/sem (15 min)", description: "Heavy Slow Resistance, charges progressives.", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 30 },
      { title: "Pas de fractionnés tant que douleur > 3/10", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 45 },
      { title: "Repas pré-sortie longue : glucides complexes 2h avant", status: "done", source: "practitioner", sourcePractitioner: "fontaine.nutritionniste", completedOffset: -10 },
    ],
    alerts: [
      { severity: "warning", title: "Tendinite achille gauche à surveiller", message: "Évolution favorable mais risque de rechute si reprise fractionnés trop tôt.", source: "system", daysOffset: -30 },
    ],
    pains: [
      { bodyZone: "Tendon d'Achille gauche", severity: 3, description: "Tendinite en amélioration sous protocole HSR.", startedOffset: -55 },
    ],
    questionnaire: baseQuestionnaire({
      pain_current: "Tendinite achille G (3/10)",
      injuries_past: "Tendinite achille G (en cours)",
      weekly_volume: "65 km",
      motivation: "9/10",
      fears: "Rechute tendinite",
      sleep_quality: "7/10",
    }),
  },

  // -------------------- 7. LÉA MOREAU --------------------
  {
    username: "lea.moreau",
    firstName: "Léa",
    lastName: "Moreau",
    phone: "+33 6 12 34 56 07",
    dob: "2000-12-03",
    gender: "F",
    height: 168,
    weight: 55,
    bloodType: "A-",
    occupation: "Étudiante en médecine",
    allergies: "Aucune",
    medications: "Aucun",
    emergencyName: "Carla Moreau",
    emergencyPhone: "+33 6 12 34 56 93",
    bio: "Première préparation semi. Apparition récente d'une douleur tendon achille — alerte importante.",
    journey: {
      sportGoal: "semi_marathon",
      raceName: "Semi-marathon de Lyon 2026",
      raceDate: "2026-10-11",
      status: "active",
      currentStepLabel: "Tendinite débutante — protocole repos relatif",
      progressPct: 24,
      weeksToRace: 22,
      startedDaysAgo: 40,
    },
    steps: [
      { order: 1, title: "Bilan médical initial", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -38, completedOffset: -38 },
      { order: 2, title: "Bilan kiné douleur achille", category: "kine", status: "in_progress", practitioner: "dupont.kine", scheduledOffset: -5 },
      { order: 3, title: "Séance ostéopathie globale", category: "osteo", status: "upcoming", practitioner: "mercier.osteo", scheduledOffset: 9 },
      { order: 4, title: "Plan nutritionnel", category: "nutrition", status: "upcoming", practitioner: "fontaine.nutritionniste", scheduledOffset: 16 },
      { order: 5, title: "Reprise progressive après douleur", category: "training", status: "upcoming", scheduledOffset: 25 },
      { order: 6, title: "Bilan mi-parcours", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 70 },
      { order: 7, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 145 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente", startedOffset: -38 },
      { practitioner: "dupont.kine", role: "Suivi tendon achille", startedOffset: -5 },
      { practitioner: "mercier.osteo", role: "Bilan global", startedOffset: 0 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -38, hour: 14, duration: 45, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial", summary: "Jeune coureuse, bonne condition. Premier semi. RAS." },
      { practitioner: "dupont.kine", daysOffset: -5, hour: 18, minute: 30, duration: 60, location: "Kiné Sport Bastille", status: "completed", reason: "Douleur achille D apparue il y a 2 sem", summary: "Tendinite achille D débutante. Repos relatif 10 jours, glaçage, étirements doux. Pas de course." },
      { practitioner: "mercier.osteo", daysOffset: 9, hour: 14, duration: 60, location: "Ostéopathie République", status: "scheduled", reason: "Bilan global suite douleur achille" },
      { practitioner: "fontaine.nutritionniste", daysOffset: 16, hour: 18, duration: 45, location: "Nutrition & Performance", status: "scheduled", reason: "Plan nutritionnel premier semi" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -38, content: "Étudiante en médecine, premier semi. État général bon. Charge de travail élevée à intégrer dans le plan.", tags: ["bilan_initial", "premier_semi"] },
      { practitioner: "dupont.kine", appointmentIdx: 1, daysOffset: -5, content: "Tendinite achille D débutante, douleur 5/10 le matin. Probable cause : montée trop rapide en volume + chaussures usées. Repos course 10 j, glace 3x/j, étirements doux. RDV dans 2 sem.", tags: ["achille", "tendinite", "premiere_occurrence"] },
    ],
    tasks: [
      { title: "STOP course pendant 10 jours", description: "Repos relatif. Vélo ou natation autorisés.", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 5 },
      { title: "Glaçage tendon achille D — 3x/jour, 15 min", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 5 },
      { title: "Acheter de nouvelles chaussures running", description: "Test boutique spécialisée. Discussion avec Anne Girard si besoin podologie.", status: "pending", source: "ai", sourcePractitioner: "dupont.kine", dueOffset: 14 },
      { title: "Étirements chaîne post. — doux, pas en charge", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 10 },
    ],
    alerts: [
      { severity: "urgent", title: "Tendinite achille débutante", message: "Première occurrence. Risque d'évolution chronique si reprise prématurée. Repos en cours, à monitorer.", source: "system", daysOffset: -5 },
      { severity: "info", title: "Recommander un bilan podologique", message: "Pour vérifier l'appui et choisir des chaussures adaptées.", source: "ai", daysOffset: -3 },
    ],
    pains: [
      { bodyZone: "Tendon d'Achille droit", severity: 5, description: "Tendinite débutante, repos en cours.", startedOffset: -19 },
    ],
    questionnaire: baseQuestionnaire({
      pain_current: "Tendinite achille D (5/10)",
      weekly_volume: "30 km (en pause)",
      motivation: "9/10",
      fears: "Que la blessure devienne chronique",
      sleep_quality: "6/10",
    }),
  },

  // -------------------- 8. NICOLAS GARCIA --------------------
  {
    username: "nicolas.garcia",
    firstName: "Nicolas",
    lastName: "Garcia",
    phone: "+33 6 12 34 56 08",
    dob: "1973-07-19",
    gender: "M",
    height: 174,
    weight: 78,
    bloodType: "O-",
    occupation: "Cadre commercial",
    allergies: "Aucune",
    medications: "Cozaar 50mg/j (HTA contrôlée depuis 6 ans)",
    emergencyName: "Isabelle Garcia",
    emergencyPhone: "+33 6 12 34 56 92",
    bio: "HTA contrôlée. 4e marathon, dernier en 2023 (Paris, 4h05). Reprise structurée.",
    journey: {
      sportGoal: "marathon",
      raceName: "Marathon Nice-Cannes 2026",
      raceDate: "2026-11-08",
      status: "active",
      currentStepLabel: "Plan d'entraînement progressif validé",
      progressPct: 30,
      weeksToRace: 26,
      startedDaysAgo: 55,
    },
    steps: [
      { order: 1, title: "Bilan médical + ECG", category: "medical", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -50, completedOffset: -50 },
      { order: 2, title: "Test d'effort avec mesure TA", category: "cardio", status: "done", practitioner: "laurent.medecindusport", scheduledOffset: -40, completedOffset: -40 },
      { order: 3, title: "Plan nutritionnel + perte de poids", category: "nutrition", status: "in_progress", practitioner: "fontaine.nutritionniste", scheduledOffset: -30 },
      { order: 4, title: "Bilan kiné préventif", category: "kine", status: "done", practitioner: "dupont.kine", scheduledOffset: -25, completedOffset: -25 },
      { order: 5, title: "Suivi TA hebdomadaire", category: "medical", status: "in_progress", scheduledOffset: -50 },
      { order: 6, title: "Plan d'entraînement validé", category: "training", status: "in_progress", scheduledOffset: -10 },
      { order: 7, title: "Bilan mi-parcours + ECG contrôle", category: "medical", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 60 },
      { order: 8, title: "Contrôle final avant course", category: "control", status: "upcoming", practitioner: "laurent.medecindusport", scheduledOffset: 165 },
    ],
    assignments: [
      { practitioner: "laurent.medecindusport", role: "Médecin référente — suivi cardio", startedOffset: -55 },
      { practitioner: "dupont.kine", role: "Bilan kiné préventif", startedOffset: -25 },
      { practitioner: "fontaine.nutritionniste", role: "Plan nutritionnel + -3 kg", startedOffset: -30 },
    ],
    appointments: [
      { practitioner: "laurent.medecindusport", daysOffset: -50, hour: 9, duration: 60, location: "Cabinet Vélodrome — Paris 11e", status: "completed", reason: "Bilan initial + ECG", summary: "ECG repos normal. HTA bien contrôlée par Cozaar. Test d'effort à programmer." },
      { practitioner: "laurent.medecindusport", daysOffset: -40, hour: 9, duration: 90, location: "Centre cardiologique partenaire", status: "completed", reason: "Test d'effort", summary: "Test d'effort normal jusqu'à 165 bpm. Pas d'arythmie. FC max recommandée 160 en entraînement." },
      { practitioner: "fontaine.nutritionniste", daysOffset: -30, hour: 17, duration: 45, location: "Nutrition & Performance", status: "completed", reason: "Plan nutrition + perte 3 kg", summary: "Réduction sucres rapides + alcool weekend. Cible 75 kg avant course." },
      { practitioner: "dupont.kine", daysOffset: -25, hour: 18, minute: 30, duration: 45, location: "Kiné Sport Bastille", status: "completed", reason: "Bilan kiné préventif", summary: "Aucune problématique majeure. Recommander étirements quotidiens et renforcement gainage." },
      { practitioner: "laurent.medecindusport", daysOffset: 18, hour: 9, duration: 30, location: "Cabinet Vélodrome — Paris 11e", status: "scheduled", reason: "Suivi TA + adaptation Cozaar si besoin" },
    ],
    notes: [
      { practitioner: "laurent.medecindusport", appointmentIdx: 0, daysOffset: -50, content: "HTA contrôlée 6 ans (Cozaar 50). 4e marathon. ECG repos normal. Test d'effort indispensable avant intensification. Mesure TA 2x/sem pendant prépa.", tags: ["hta", "cardio", "marathon"] },
      { practitioner: "laurent.medecindusport", appointmentIdx: 1, daysOffset: -40, content: "Test d'effort normal. Pas d'arythmie. Plafond FC 160 en entraînement (zone 2-3). Si TA augmente > 145/95, consulter.", tags: ["test_effort", "fc_max"] },
      { practitioner: "fontaine.nutritionniste", appointmentIdx: 2, daysOffset: -30, content: "IMC 25.7. Plan -3 kg en 22 semaines. Réduire sucres rapides, alcool weekend < 2 verres, augmenter protéines lean. Glucides complexes pré et post-effort.", tags: ["nutrition", "perte_de_poids"] },
      { practitioner: "dupont.kine", appointmentIdx: 3, daysOffset: -25, content: "Bilan kiné RAS. Patient mature, conscient des risques. Programme préventif : gainage 3x/sem, étirements chaîne post. quotidien.", tags: ["bilan_kine", "preventif"] },
    ],
    tasks: [
      { title: "Mesurer TA matin et soir, noter dans l'app", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 0 },
      { title: "Réduire l'alcool weekend < 2 verres", status: "in_progress", source: "practitioner", sourcePractitioner: "fontaine.nutritionniste", dueOffset: 30 },
      { title: "Sortie longue uniquement zone 2 (FC < 145)", status: "in_progress", source: "practitioner", sourcePractitioner: "laurent.medecindusport", dueOffset: 60 },
      { title: "Gainage 3x/sem (15 min)", status: "in_progress", source: "practitioner", sourcePractitioner: "dupont.kine", dueOffset: 60 },
      { title: "Test d'effort cardiologique annuel", status: "done", source: "practitioner", sourcePractitioner: "laurent.medecindusport", completedOffset: -40 },
    ],
    alerts: [
      { severity: "info", title: "Tension artérielle moyenne 138/85 — surveiller", message: "Légèrement au-dessus de la cible mais stable. Pas de modification de traitement requise pour l'instant.", source: "system", daysOffset: -7 },
    ],
    pains: [],
    questionnaire: baseQuestionnaire({
      cardiac_history: "HTA contrôlée par Cozaar 50",
      cardiac_family: "Non significatif",
      hypertension: "Oui — traitée et contrôlée",
      weekly_volume: "35 km",
      motivation: "9/10",
      sleep_quality: "7/10",
      fears: "Bien tenir le suivi cardio",
    }),
  },
];
