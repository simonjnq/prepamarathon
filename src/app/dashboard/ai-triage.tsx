"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { aiTriagePatients, type TriageItem } from "./ai-triage-actions";

export function AITriage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TriageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await aiTriagePatients();
      if (r.source === "gemini") {
        setItems(r.items);
      } else if (r.source === "empty") {
        setItems([]);
      } else if (r.source === "unavailable") {
        setError("Gemini non configuré (GEMINI_API_KEY).");
      } else {
        setError(r.error ?? "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-coral-bg to-stone-bg px-6 py-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-coral">
            <Sparkles size={14} strokeWidth={2.5} />
            Veille IA — patients à voir aujourd&apos;hui
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Gemini analyse vos patients par priorité et propose une action
            pour chacun.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 text-xs! px-4! py-2!"
        >
          {loading ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : (
            <Sparkles size={14} strokeWidth={2.5} />
          )}
          {loading ? "Analyse…" : items ? "Refaire" : "Lancer la veille"}
        </button>
      </div>

      {error && (
        <p className="border-t border-line bg-rust-bg px-6 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      {items && items.length === 0 && !error && (
        <p className="border-t border-line px-6 py-5 text-sm text-ink-muted">
          Aucun patient assigné, ou rien à signaler.
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const tone =
              it.priority === "high"
                ? { bg: "bg-rust-bg", text: "text-rust", label: "Haute" }
                : it.priority === "medium"
                  ? { bg: "bg-amber-bg", text: "text-amber", label: "Moyenne" }
                  : { bg: "bg-leaf-bg", text: "text-leaf", label: "Basse" };
            return (
              <li key={it.patientId}>
                <Link
                  href={`/patients/${it.patientId}` as never}
                  className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-cream-soft"
                >
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.bg} ${tone.text}`}
                  >
                    {tone.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{it.patientName}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {it.headline}
                    </p>
                    <p className="mt-1 text-sm font-medium text-coral">
                      → {it.recommendation}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.75}
                    className="mt-1 shrink-0 text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-coral"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
