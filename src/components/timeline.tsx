import { Badge, statusBadgeVariant } from "@/components/badge";
import {
  STEP_CATEGORY_LABELS,
  STEP_STATUS_LABELS,
  fmtDateLong,
} from "@/lib/labels";

export type TimelineStep = {
  id: string;
  order_idx: number;
  title: string;
  description: string | null;
  category: string;
  status: "done" | "in_progress" | "upcoming";
  scheduled_at: string | null;
  completed_at: string | null;
  practitioner_name?: string | null;
};

export function Timeline({
  steps,
  renderActions,
}: {
  steps: TimelineStep[];
  renderActions?: (step: TimelineStep) => React.ReactNode;
}) {
  if (!steps.length) {
    return (
      <p className="text-sm text-ink-muted">
        Aucune étape de parcours pour l&apos;instant.
      </p>
    );
  }

  const sorted = [...steps].sort((a, b) => a.order_idx - b.order_idx);

  return (
    <ol className="relative pl-7">
      <span
        className="absolute left-2 top-2 bottom-2 w-px bg-line"
        aria-hidden
      />
      {sorted.map((step) => {
        const dotClass =
          step.status === "done"
            ? "bg-leaf"
            : step.status === "in_progress"
              ? "bg-coral ring-4 ring-coral-bg"
              : "bg-cream border-2 border-line";
        return (
          <li key={step.id} className="relative pb-7 last:pb-0">
            <span
              className={`absolute -left-[26px] top-1.5 inline-block h-4 w-4 rounded-full ${dotClass}`}
              aria-hidden
            />
            <div className="rounded-md border border-line bg-surface px-4 py-3 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-light">
                    {STEP_CATEGORY_LABELS[step.category] ?? step.category}
                  </p>
                  <h4 className="mt-0.5 font-bold leading-tight">
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {step.description}
                    </p>
                  )}
                </div>
                <Badge variant={statusBadgeVariant(step.status)}>
                  {STEP_STATUS_LABELS[step.status] ?? step.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                {step.scheduled_at && (
                  <span>📅 {fmtDateLong(step.scheduled_at)}</span>
                )}
                {step.practitioner_name && (
                  <span>· {step.practitioner_name}</span>
                )}
              </div>
              {renderActions && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {renderActions(step)}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
