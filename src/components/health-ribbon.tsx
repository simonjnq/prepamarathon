import { AlertTriangle, Flame, Heart, Pill } from "lucide-react";

/**
 * Ruban d'alertes santé affiché en haut de la fiche patient.
 * Surface immédiatement les informations qu'un praticien doit voir
 * sans scroller : allergies, traitements en cours, alertes critiques,
 * et badge 'Patient à risque' si plusieurs urgentes ouvertes (D3).
 */
export function HealthRibbon({
  allergies,
  medications,
  bloodType,
  hasUrgentAlert,
  urgentAlertCount = 0,
}: {
  allergies?: string | null;
  medications?: string | null;
  bloodType?: string | null;
  hasUrgentAlert?: boolean;
  urgentAlertCount?: number;
}) {
  const hasAllergies =
    allergies && allergies.trim() !== "" && !/aucune?/i.test(allergies);
  const hasMeds =
    medications && medications.trim() !== "" && !/aucun/i.test(medications);
  const isAtRisk = urgentAlertCount >= 2;

  if (
    !hasAllergies &&
    !hasMeds &&
    !hasUrgentAlert &&
    !bloodType &&
    !isAtRisk
  )
    return null;

  return (
    <div className="sticky top-0 z-20 -mx-5 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-cream/95 px-5 py-3 text-sm shadow-sm backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
      {isAtRisk && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rust px-2.5 py-1 font-bold text-white">
          <Flame size={14} strokeWidth={2.5} />
          Patient à risque · {urgentAlertCount} alertes urgentes
        </span>
      )}
      {hasUrgentAlert && !isAtRisk && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rust-bg px-2.5 py-1 font-bold text-rust">
          <AlertTriangle size={14} strokeWidth={2.5} />
          Alerte urgente ouverte
        </span>
      )}
      {hasAllergies && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-bg"
            aria-hidden
          >
            <AlertTriangle size={12} strokeWidth={2.5} className="text-amber" />
          </span>
          <span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber">
              Allergies
            </span>
            <span className="ml-1.5 font-medium text-ink">{allergies}</span>
          </span>
        </span>
      )}
      {hasMeds && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-bg"
            aria-hidden
          >
            <Pill size={12} strokeWidth={2.5} className="text-stone" />
          </span>
          <span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone">
              Traitement
            </span>
            <span className="ml-1.5 font-medium text-ink">{medications}</span>
          </span>
        </span>
      )}
      {bloodType && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rust-bg"
            aria-hidden
          >
            <Heart size={12} strokeWidth={2.5} className="text-rust" />
          </span>
          <span>
            <span className="text-xs font-bold uppercase tracking-wider text-rust">
              Groupe
            </span>
            <span className="ml-1.5 font-bold text-ink">{bloodType}</span>
          </span>
        </span>
      )}
    </div>
  );
}
