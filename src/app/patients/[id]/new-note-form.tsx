"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { createNoteAction } from "./actions";
import { suggestTaskFromNote } from "@/lib/note-suggestions";

export function NewNoteForm({ patientId }: { patientId: string }) {
  const [content, setContent] = useState("");
  const [generate, setGenerate] = useState(true);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const s = suggestTaskFromNote(content);
    setSuggested(s ? s.title : null);
  }, [content]);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createNoteAction(fd);
          setContent("");
        } finally {
          setPending(false);
        }
      }}
      className="rounded-lg border border-line bg-surface-warm p-5"
    >
      <input type="hidden" name="patient_id" value={patientId} />
      <label
        htmlFor="content"
        className="block text-xs font-bold uppercase tracking-wider text-ink-muted"
      >
        Nouvelle note de suivi
      </label>
      <textarea
        id="content"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Observations, recommandations, prochaines étapes…"
        className="input mt-2 resize-y"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="generate_task"
            checked={generate}
            onChange={(e) => setGenerate(e.target.checked)}
            className="h-4 w-4 accent-coral"
          />
          <span className="text-ink-muted">
            Générer une tâche pour le patient si pertinent
          </span>
        </label>
        <button type="submit" disabled={pending || !content.trim()} className="btn-primary">
          {pending ? "Enregistrement…" : "Enregistrer la note"}
        </button>
      </div>

      {generate && suggested && (
        <div className="mt-3 flex items-start gap-2 rounded-[12px] bg-coral-bg px-3 py-2 text-sm">
          <Sparkles
            size={16}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-coral"
          />
          <div>
            <p className="font-bold text-coral">Tâche suggérée</p>
            <p className="text-ink">{suggested}</p>
          </div>
        </div>
      )}
    </form>
  );
}
