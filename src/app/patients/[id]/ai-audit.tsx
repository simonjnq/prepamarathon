"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  aiAuditPatient,
  applyFindingAction,
  type AuditFinding,
} from "./ai-audit-actions";

export function AIAudit({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<AuditFinding[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await aiAuditPatient(patientId);
      if (r.source === "gemini") {
        setFindings(r.findings);
        setSummary(r.summary ?? null);
      } else if (r.source === "unavailable") {
        setError("Gemini n'est pas configuré (GEMINI_API_KEY).");
      } else {
        setError(r.error ?? "Erreur inconnue.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-coral-bg to-surface-warm px-6 py-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-coral">
            <Sparkles size={14} strokeWidth={2.5} />
            Audit IA du parcours
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Gemini analyse le parcours du patient et signale les{" "}
            <span className="font-accent text-coral">points d&apos;attention</span>.
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
          {loading ? "Analyse…" : findings ? "Refaire l'audit" : "Lancer l'audit"}
        </button>
      </div>

      {error && (
        <div className="border-t border-line bg-rust-bg px-6 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      {summary && (
        <div className="border-t border-line px-6 py-4">
          <p className="text-sm italic text-ink-muted">« {summary} »</p>
        </div>
      )}

      {findings && findings.length === 0 && !error && (
        <div className="border-t border-line px-6 py-5 text-center">
          <CheckCircle2
            size={28}
            strokeWidth={1.5}
            className="mx-auto text-leaf"
          />
          <p className="mt-2 text-sm font-bold text-leaf">
            Rien à signaler
          </p>
          <p className="text-xs text-ink-muted">
            Le parcours du patient est cohérent.
          </p>
        </div>
      )}

      {findings && findings.length > 0 && (
        <ul className="divide-y divide-line">
          {findings.map((f, i) => {
            const tone =
              f.severity === "critical"
                ? { bg: "bg-rust-bg", text: "text-rust" }
                : f.severity === "warning"
                  ? { bg: "bg-amber-bg", text: "text-amber" }
                  : { bg: "bg-stone-bg", text: "text-stone" };
            const key = `${i}-${f.title}`;
            const applied = appliedKeys.has(key);
            return (
              <li key={key} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg}`}
                  >
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.5}
                      className={tone.text}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight">{f.title}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {f.detail}
                    </p>
                    {f.suggestedAction && !applied && (
                      <form
                        action={async (fd) => {
                          await applyFindingAction(fd);
                          setAppliedKeys((prev) => new Set(prev).add(key));
                        }}
                        className="mt-2"
                      >
                        <input type="hidden" name="patient_id" value={patientId} />
                        <input type="hidden" name="action_type" value={f.suggestedAction.type} />
                        <input type="hidden" name="action_title" value={f.suggestedAction.title} />
                        <input
                          type="hidden"
                          name="action_due"
                          value={String(f.suggestedAction.dueInDays ?? 7)}
                        />
                        <input
                          type="hidden"
                          name="action_severity"
                          value={f.suggestedAction.severity ?? "warning"}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-sm border border-coral bg-coral-bg px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral hover:text-white"
                        >
                          {f.suggestedAction.type === "task" &&
                            "Créer cette tâche"}
                          {f.suggestedAction.type === "appointment" &&
                            "Programmer ce RDV"}
                          {f.suggestedAction.type === "alert" &&
                            "Créer cette alerte"}
                          <span className="opacity-70">
                            : {f.suggestedAction.title}
                          </span>
                        </button>
                      </form>
                    )}
                    {applied && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-leaf">
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        Action créée
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
