"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { aiWeeklySummary, type WeeklySummary } from "./ai-summary-actions";

export function AISummary({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  async function run() {
    setLoading(true);
    try {
      const r = await aiWeeklySummary(patientId);
      setSummary(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-bg px-6 py-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={18} strokeWidth={1.75} className="text-stone" />
          <h2 className="text-base font-extrabold">Synthèse de la semaine</h2>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-bold text-stone hover:border-stone disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={13} strokeWidth={2} className="animate-spin" />
          ) : (
            <Sparkles size={13} strokeWidth={2.5} />
          )}
          {loading ? "Analyse…" : summary ? "Rafraîchir" : "Générer la synthèse"}
        </button>
      </div>

      {summary?.source === "unavailable" && (
        <p className="px-6 py-4 text-sm text-amber">
          Gemini non configuré (GEMINI_API_KEY).
        </p>
      )}
      {summary?.source === "error" && (
        <p className="px-6 py-4 text-sm text-rust">
          Erreur : {summary.error}
        </p>
      )}

      {summary?.source === "gemini" && (
        <div className="px-6 py-5 space-y-4">
          {summary.headline && (
            <p className="text-lg font-extrabold leading-snug">
              {summary.headline}
            </p>
          )}

          {summary.highlights && summary.highlights.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-leaf">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                Points positifs
              </p>
              <ul className="space-y-1">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-leaf">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.concerns && summary.concerns.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber">
                <AlertCircle size={12} strokeWidth={2.5} />
                Points de vigilance
              </p>
              <ul className="space-y-1">
                {summary.concerns.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-amber">⚠</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.next_focus && (
            <div className="rounded-sm border border-line bg-surface-warm px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-coral">
                À regarder la semaine prochaine
              </p>
              <p className="mt-0.5 text-sm">{summary.next_focus}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
