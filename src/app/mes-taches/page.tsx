import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { requirePatient } from "@/lib/auth";
import { TASK_SOURCE_LABELS, fmtRelative } from "@/lib/labels";
import { toggleTaskAction } from "./actions";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  source: string;
  due_at: string | null;
  completed_at: string | null;
};

export default async function MesTachesPage() {
  const { supabase, profile } = await requirePatient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, status, source, due_at, completed_at, created_at")
    .eq("patient_id", profile.id)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  const open = ((tasks ?? []) as TaskRow[]).filter(
    (t) => t.status !== "done",
  );
  const done = ((tasks ?? []) as TaskRow[]).filter((t) => t.status === "done");

  return (
    <AppShell profile={profile}>
      <header>
        <p className="text-sm text-ink-muted">Vos actions</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mes{" "}
          <span className="font-accent font-normal text-coral">
            tâches
          </span>
        </h1>
        <p className="mt-2 text-ink-muted">
          {open.length} en cours · {done.length} terminée
          {done.length > 1 ? "s" : ""}
        </p>
      </header>

      <section className="mt-7">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          À faire
        </h2>
        {open.length === 0 ? (
          <p className="card mt-3 p-6 text-sm text-ink-muted">
            Vous êtes à jour. Profitez-en pour vous reposer.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {open.map((t) => (
              <li key={t.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <form action={toggleTaskAction} className="pt-0.5">
                    <input type="hidden" name="task_id" value={t.id} />
                    <input type="hidden" name="mark_done" value="1" />
                    <button
                      type="submit"
                      aria-label="Marquer comme terminée"
                      className="text-ink-light hover:text-coral"
                    >
                      <Circle size={22} strokeWidth={1.75} />
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.title}</p>
                    {t.description && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {t.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-ink-light">
                        {t.source === "ai" && (
                          <Sparkles
                            size={12}
                            strokeWidth={2}
                            className="mr-1 inline text-coral"
                          />
                        )}
                        {TASK_SOURCE_LABELS[t.source] ?? t.source}
                      </span>
                      {t.due_at && (
                        <Badge variant="coral">{fmtRelative(t.due_at)}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-9">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Terminées
          </h2>
          <ul className="mt-3 space-y-2">
            {done.map((t) => (
              <li
                key={t.id}
                className="flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3"
              >
                <form action={toggleTaskAction} className="pt-0.5">
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="mark_done" value="0" />
                  <button
                    type="submit"
                    aria-label="Annuler"
                    className="text-leaf hover:text-coral"
                  >
                    <CheckCircle2 size={22} strokeWidth={1.75} />
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-muted line-through">
                    {t.title}
                  </p>
                  {t.completed_at && (
                    <p className="text-xs text-ink-light">
                      {fmtRelative(t.completed_at)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
