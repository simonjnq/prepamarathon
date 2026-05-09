"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateNoteAction } from "./actions";
import { fmtRelative, SPECIALTY_LABELS } from "@/lib/labels";

export function NoteRow({
  note,
  patientId,
  isAuthor,
}: {
  note: {
    id: string;
    content: string;
    tags: string[] | null;
    created_at: string;
    practitioners: {
      profiles: { first_name: string; last_name: string };
      specialty: string;
    };
  };
  patientId: string;
  isAuthor: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [pending, setPending] = useState(false);

  return (
    <li className="rounded-md border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold">
          {note.practitioners.profiles.first_name}{" "}
          {note.practitioners.profiles.last_name}
          <span className="ml-2 text-xs font-normal text-ink-light">
            {SPECIALTY_LABELS[note.practitioners.specialty] ??
              note.practitioners.specialty}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-light">
            {fmtRelative(note.created_at)}
          </p>
          {isAuthor && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-ink-light hover:text-coral"
              aria-label="Modifier"
            >
              <Pencil size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form
          action={async (fd) => {
            setPending(true);
            try {
              await updateNoteAction(fd);
              setEditing(false);
            } finally {
              setPending(false);
            }
          }}
          className="mt-2"
        >
          <input type="hidden" name="note_id" value={note.id} />
          <input type="hidden" name="patient_id" value={patientId} />
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="input resize-y"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setContent(note.content);
                setEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted hover:border-coral"
            >
              <X size={12} strokeWidth={2} /> Annuler
            </button>
            <button
              type="submit"
              disabled={pending || !content.trim()}
              className="btn-primary text-xs! px-3! py-1.5!"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {note.content}
        </p>
      )}

      {note.tags && note.tags.length > 0 && !editing && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {note.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-cream-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
