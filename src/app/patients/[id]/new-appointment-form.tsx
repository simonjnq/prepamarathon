"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { createAppointmentAction } from "./actions";

const DEFAULT_TIME = "09:00";

export function NewAppointmentForm({
  patientId,
  defaultLocation,
}: {
  patientId: string;
  defaultLocation?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Default to tomorrow (relative to demo today)
  const tomorrow = (() => {
    const d = new Date("2026-05-09T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-surface-warm px-4 py-2 text-sm font-bold text-coral transition-colors hover:border-coral"
      >
        <Plus size={14} strokeWidth={2.5} />
        Programmer un rendez-vous
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createAppointmentAction(fd);
          setOpen(false);
        } finally {
          setPending(false);
        }
      }}
      className="mb-4 rounded-md border border-line bg-surface-warm p-4"
    >
      <input type="hidden" name="patient_id" value={patientId} />
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-coral">
          <CalendarIcon size={14} strokeWidth={2} />
          Nouveau rendez-vous
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink-light hover:text-coral"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Date
          </span>
          <input
            type="date"
            name="date"
            defaultValue={tomorrow}
            required
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Heure
          </span>
          <input
            type="time"
            name="time"
            defaultValue={DEFAULT_TIME}
            required
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Durée (min)
          </span>
          <select name="duration" defaultValue="30" className="input">
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Motif
        </span>
        <input
          type="text"
          name="reason"
          required
          placeholder="Ex : suivi tendinite achille"
          className="input"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Lieu
        </span>
        <input
          type="text"
          name="location"
          defaultValue={defaultLocation ?? ""}
          placeholder="Ex : Cabinet Vélodrome — Paris 11e"
          className="input"
        />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Création…" : "Créer le rendez-vous"}
        </button>
      </div>
    </form>
  );
}
