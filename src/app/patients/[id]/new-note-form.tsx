"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { createNoteAction } from "./actions";
import { aiSuggestFromNote, type AISuggestion } from "./ai-actions";
import { suggestTaskFromNote } from "@/lib/note-suggestions";

type Suggestion = AISuggestion;
type Source = "heuristic" | "gemini" | "unavailable" | "error";

export function NewNoteForm({ patientId }: { patientId: string }) {
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [source, setSource] = useState<Source>("heuristic");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Live heuristic preview (no AI call)
  useEffect(() => {
    if (source === "gemini") return; // don't override AI results
    const h = suggestTaskFromNote(content);
    if (h) {
      setSuggestions([
        {
          title: h.title,
          dueInDays: h.dueInDays,
          reasoning: "Détecté par mots-clés dans votre note.",
        },
      ]);
      setSelected(new Set([0]));
    } else {
      setSuggestions([]);
      setSelected(new Set());
    }
    setSource("heuristic");
  }, [content, source]);

  async function runAI() {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await aiSuggestFromNote(content);
      if (result.source === "gemini") {
        setSuggestions(result.suggestions);
        setSelected(new Set(result.suggestions.map((_, i) => i)));
        setSource("gemini");
      } else if (result.source === "unavailable") {
        setAiError(
          "L'IA n'est pas configurée (GEMINI_API_KEY manquante). Vous pouvez utiliser la suggestion automatique par mots-clés.",
        );
      } else {
        setAiError(result.error ?? "Une erreur est survenue.");
      }
    } finally {
      setAiLoading(false);
    }
  }

  function toggleAll(checked: boolean) {
    if (checked)
      setSelected(new Set(suggestions.map((_, i) => i)));
    else setSelected(new Set());
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function reset() {
    setContent("");
    setSuggestions([]);
    setSelected(new Set());
    setSource("heuristic");
    setAiError(null);
  }

  const selectedList = Array.from(selected)
    .map((i) => suggestions[i])
    .filter(Boolean);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createNoteAction(fd);
          reset();
        } finally {
          setPending(false);
        }
      }}
      className="rounded-lg border border-line bg-surface-warm p-5"
    >
      <input type="hidden" name="patient_id" value={patientId} />
      <input type="hidden" name="ai_source" value={source} />
      <input
        type="hidden"
        name="selected_suggestions"
        value={JSON.stringify(selectedList)}
      />

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
        onChange={(e) => {
          setContent(e.target.value);
          if (source === "gemini") setSource("heuristic"); // typing again invalidates AI result
        }}
        rows={4}
        placeholder="Observations, recommandations, prochaines étapes…"
        className="input mt-2 resize-y"
      />

      {aiError && (
        <p className="mt-3 rounded-md bg-amber-bg px-3 py-2 text-sm text-amber">
          {aiError}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 rounded-md bg-coral-bg/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-coral">
              <Sparkles size={13} strokeWidth={2.5} />
              {source === "gemini"
                ? `Suggestions de Gemini (${suggestions.length})`
                : "Tâche suggérée (mots-clés)"}
            </p>
            {suggestions.length > 1 && (
              <button
                type="button"
                onClick={() => toggleAll(selected.size !== suggestions.length)}
                className="text-xs font-bold text-coral hover:underline"
              >
                {selected.size === suggestions.length
                  ? "Tout décocher"
                  : "Tout cocher"}
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-coral/20 bg-surface px-3 py-2.5 hover:border-coral/40">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-coral"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight">
                      {s.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className="text-coral font-bold">
                        Échéance :{" "}
                        {s.dueInDays === 0
                          ? "aujourd'hui"
                          : `${s.dueInDays} j`}
                      </span>
                      {s.reasoning && (
                        <span className="text-ink-muted italic">
                          — {s.reasoning}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={runAI}
          disabled={!content.trim() || aiLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 py-2 text-xs font-bold text-coral transition-colors hover:border-coral disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aiLoading ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : (
            <Sparkles size={14} strokeWidth={2.5} />
          )}
          {aiLoading ? "Analyse en cours…" : "Affiner avec Gemini"}
        </button>
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="btn-primary"
        >
          {pending
            ? "Enregistrement…"
            : selectedList.length > 0
              ? `Enregistrer + créer ${selectedList.length} tâche${selectedList.length > 1 ? "s" : ""}`
              : "Enregistrer la note"}
        </button>
      </div>
    </form>
  );
}
