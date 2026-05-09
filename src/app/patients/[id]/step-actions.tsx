"use client";

import { CheckCircle2, Play } from "lucide-react";
import { setStepStatusAction } from "./actions";
import type { TimelineStep } from "@/components/timeline";

export function StepActions({
  step,
  patientId,
}: {
  step: TimelineStep;
  patientId: string;
}) {
  if (step.status === "done") {
    return (
      <span className="text-xs text-ink-light">
        ✓ Terminée{" "}
        {step.completed_at &&
          new Date(step.completed_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
      </span>
    );
  }

  return (
    <>
      {step.status === "upcoming" && (
        <form action={setStepStatusAction}>
          <input type="hidden" name="step_id" value={step.id} />
          <input type="hidden" name="patient_id" value={patientId} />
          <input type="hidden" name="status" value="in_progress" />
          <button className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-coral hover:border-coral">
            <Play size={12} strokeWidth={2.5} />
            Démarrer
          </button>
        </form>
      )}
      <form action={setStepStatusAction}>
        <input type="hidden" name="step_id" value={step.id} />
        <input type="hidden" name="patient_id" value={patientId} />
        <input type="hidden" name="status" value="done" />
        <button className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-leaf hover:border-leaf">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          Marquer terminée
        </button>
      </form>
    </>
  );
}
