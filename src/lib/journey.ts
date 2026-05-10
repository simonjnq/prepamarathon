/**
 * Helpers de calcul vivant pour les parcours.
 *
 * progress_pct est désormais maintenu par trigger SQL (migration 0018),
 * mais weeks_to_race se recalcule à la volée car "today" change chaque
 * jour. On peut aussi recalculer côté JS pour redondance.
 */

const DEMO_TODAY = new Date("2026-05-10T00:00:00Z");

export function weeksToRace(
  raceDate: string | null | undefined,
  fallback?: number | null,
): number | null {
  if (!raceDate) return fallback ?? null;
  const race = new Date(raceDate);
  if (Number.isNaN(race.getTime())) return fallback ?? null;
  const diffMs = race.getTime() - DEMO_TODAY.getTime();
  return Math.round(diffMs / (7 * 86_400_000));
}

export function daysToRace(
  raceDate: string | null | undefined,
): number | null {
  if (!raceDate) return null;
  const race = new Date(raceDate);
  if (Number.isNaN(race.getTime())) return null;
  return Math.round(
    (race.getTime() - DEMO_TODAY.getTime()) / 86_400_000,
  );
}

/** Calcule un score de priorité d'un patient pour le triage praticien.
 *  Plus le score est haut, plus le patient mérite d'attention.
 */
export type PriorityInput = {
  alertsUrgent: number;
  alertsWarning: number;
  alertsInfo: number;
  maxActivePainSeverity: number; // 0-10, 0 si aucune
  daysSinceLastAppointment: number | null;
  weeksToRace: number | null;
};

export function priorityScore(input: PriorityInput): number {
  let s = 0;
  s += input.alertsUrgent * 30;
  s += input.alertsWarning * 10;
  s += input.alertsInfo * 2;
  s += Math.max(0, input.maxActivePainSeverity - 3) * 4; // pain >=4 compte
  if (input.daysSinceLastAppointment != null) {
    s += Math.min(30, input.daysSinceLastAppointment); // cap 30
  }
  if (input.weeksToRace != null && input.weeksToRace >= 0 && input.weeksToRace <= 4) {
    s += 20;
  }
  return s;
}

export function priorityLabel(
  score: number,
): { label: string; variant: "rust" | "amber" | "leaf" | "neutral" } {
  if (score >= 60) return { label: "Priorité haute", variant: "rust" };
  if (score >= 25) return { label: "À surveiller", variant: "amber" };
  if (score > 0) return { label: "Suivi normal", variant: "neutral" };
  return { label: "OK", variant: "leaf" };
}
