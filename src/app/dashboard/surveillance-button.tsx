"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import { runSurveillance, type SurveillanceResult } from "./surveillance-actions";

export function SurveillanceButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SurveillanceResult | null>(null);

  async function run() {
    setLoading(true);
    try {
      const r = await runSurveillance();
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  const total = result
    ? result.preRaceReminders +
      result.apptReminders +
      result.missedApptAlerts +
      result.overdueTaskReminders +
      result.unmonitoredPainAlerts
    : 0;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone">
            <Eye size={14} strokeWidth={2.5} />
            Surveillance temporelle
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Scanne tous vos patients : relances pré-course, rappels RDV,
            RDV non honorés, tâches en retard, douleurs non monitorées.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 py-2 text-xs font-bold text-stone hover:border-stone disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={13} strokeWidth={2} className="animate-spin" />
          ) : (
            <Eye size={13} strokeWidth={2.5} />
          )}
          {loading ? "Analyse…" : result ? "Relancer" : "Lancer la veille"}
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          {total === 0 ? (
            <p className="flex items-center gap-2 rounded-md bg-leaf-bg px-3 py-2 text-sm text-leaf">
              <CheckCircle2 size={14} strokeWidth={2} />
              Tout est à jour. Aucune action automatique requise.
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-md bg-coral-bg px-3 py-2 text-sm text-coral">
              <CheckCircle2 size={14} strokeWidth={2} />
              {total} action{total > 1 ? "s" : ""} automatique
              {total > 1 ? "s" : ""} déclenchée{total > 1 ? "s" : ""}.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat
              label="Relances pré-course"
              value={result.preRaceReminders}
              Icon={Send}
            />
            <Stat
              label="Rappels veille RDV"
              value={result.apptReminders}
              Icon={Bell}
            />
            <Stat
              label="RDV non honorés"
              value={result.missedApptAlerts}
              Icon={AlertTriangle}
            />
            <Stat
              label="Tâches en retard"
              value={result.overdueTaskReminders}
              Icon={Bell}
            />
            <Stat
              label="Douleurs non suivies"
              value={result.unmonitoredPainAlerts}
              Icon={AlertTriangle}
            />
          </div>

          {result.details.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-coral">
                Détail ({result.details.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4 text-xs text-ink-muted">
                {result.details.map((d, i) => (
                  <li key={i}>· {d}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof Send;
}) {
  return (
    <div className="rounded-md border border-line bg-surface-warm px-3 py-2">
      <Icon
        size={14}
        strokeWidth={1.75}
        className={value > 0 ? "text-coral" : "text-ink-light"}
      />
      <p className="mt-1 text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-light">
        {label}
      </p>
    </div>
  );
}
