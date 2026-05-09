export const SPECIALTY_LABELS: Record<string, string> = {
  medecin_du_sport: "Médecin du sport",
  kinesitherapeute: "Kinésithérapeute",
  osteopathe: "Ostéopathe",
  nutritionniste: "Nutritionniste",
  podologue: "Podologue",
  cardiologue: "Cardiologue",
  psychologue: "Psychologue",
  coach: "Coach",
};

export const SPORT_GOAL_LABELS: Record<string, string> = {
  marathon: "Marathon",
  semi_marathon: "Semi-marathon",
  "10km": "10 km",
  "5km": "5 km",
  running: "Running",
  reprise: "Reprise sportive",
};

export const STEP_CATEGORY_LABELS: Record<string, string> = {
  medical: "Médical",
  kine: "Kinésithérapie",
  osteo: "Ostéopathie",
  nutrition: "Nutrition",
  training: "Entraînement",
  control: "Contrôle",
  podologie: "Podologie",
  cardio: "Cardiologie",
  mental: "Mental",
};

export const STEP_STATUS_LABELS: Record<string, string> = {
  done: "Réalisé",
  in_progress: "En cours",
  upcoming: "À venir",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Programmé",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Non honoré",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "À faire",
  in_progress: "En cours",
  done: "Terminé",
  snoozed: "Différé",
};

export const TASK_SOURCE_LABELS: Record<string, string> = {
  practitioner: "Praticien",
  system: "Système",
  patient: "Vous",
  ai: "Assistant IA",
};

export const ALERT_SEVERITY_LABELS: Record<string, string> = {
  info: "Info",
  warning: "À surveiller",
  urgent: "Urgent",
};

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date("2026-05-09T00:00:00Z"); // demo anchor
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date("2026-05-09T10:00:00Z"); // demo anchor
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "demain";
  if (diffDays === -1) return "hier";
  if (diffDays > 1 && diffDays < 14) return `dans ${diffDays} j`;
  if (diffDays < -1 && diffDays > -14) return `il y a ${-diffDays} j`;
  if (diffDays >= 14 && diffDays < 60)
    return `dans ${Math.round(diffDays / 7)} sem.`;
  if (diffDays <= -14 && diffDays > -60)
    return `il y a ${Math.round(-diffDays / 7)} sem.`;
  return fmtDateShort(iso);
}

export function initials(firstName?: string | null, lastName?: string | null) {
  return `${(firstName ?? "?")[0] ?? "?"}${(lastName ?? "?")[0] ?? "?"}`.toUpperCase();
}
