"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { setAppointmentStatusAction } from "./actions";

export function AppointmentActions({
  apptId,
  patientId,
}: {
  apptId: string;
  patientId: string;
}) {
  const [openSummary, setOpenSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [pending, setPending] = useState(false);

  if (openSummary) {
    return (
      <form
        action={async (fd) => {
          setPending(true);
          try {
            await setAppointmentStatusAction(fd);
            setOpenSummary(false);
          } finally {
            setPending(false);
          }
        }}
        className="mt-2"
      >
        <input type="hidden" name="appointment_id" value={apptId} />
        <input type="hidden" name="patient_id" value={patientId} />
        <input type="hidden" name="status" value="completed" />
        <textarea
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Compte rendu de la consultation (optionnel)"
          rows={2}
          className="input resize-y text-sm"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpenSummary(false)}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink-muted hover:border-coral"
          >
            <X size={12} strokeWidth={2} /> Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary text-xs! px-3! py-1!"
          >
            {pending ? "…" : "Valider"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpenSummary(true)}
      className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-leaf hover:border-leaf"
    >
      <CheckCircle2 size={12} strokeWidth={2.5} />
      Marquer terminé
    </button>
  );
}
