"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addAssignmentAction, removeAssignmentAction } from "./actions";

export function AddPractitionerInline({
  patientId,
  candidates,
}: {
  patientId: string;
  candidates: Array<{
    id: string;
    name: string;
    specialty_label: string;
  }>;
}) {
  const [open, setOpen] = useState(false);
  const [practitionerId, setPractitionerId] = useState(candidates[0]?.id ?? "");
  const [role, setRole] = useState("");
  const [pending, setPending] = useState(false);

  if (candidates.length === 0) {
    return (
      <p className="mt-3 text-xs italic text-ink-light">
        Toute l&apos;équipe est déjà assignée.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-dashed border-line bg-surface-warm px-3 py-1.5 text-xs font-bold text-coral hover:border-coral"
      >
        <Plus size={12} strokeWidth={2.5} /> Inviter un praticien
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await addAssignmentAction(fd);
          setOpen(false);
          setRole("");
        } finally {
          setPending(false);
        }
      }}
      className="mt-3 rounded-sm border border-line bg-surface-warm p-3"
    >
      <input type="hidden" name="patient_id" value={patientId} />
      <div className="flex flex-col gap-2">
        <select
          name="practitioner_id"
          value={practitionerId}
          onChange={(e) => setPractitionerId(e.target.value)}
          className="input text-sm"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.specialty_label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Rôle dans le parcours (optionnel)"
          className="input text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink-muted hover:border-coral"
          >
            <X size={12} strokeWidth={2} /> Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary text-xs! px-3! py-1!"
          >
            {pending ? "…" : "Inviter"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function RemoveAssignmentButton({
  assignmentId,
  patientId,
}: {
  assignmentId: string;
  patientId: string;
}) {
  return (
    <form action={removeAssignmentAction} className="ml-auto">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="patient_id" value={patientId} />
      <button
        type="submit"
        aria-label="Retirer du parcours"
        className="text-ink-light hover:text-rust"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </form>
  );
}
