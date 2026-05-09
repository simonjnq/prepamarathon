import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requirePatient } from "@/lib/auth";

export default async function MonQuestionnairePage() {
  const { supabase, profile } = await requirePatient();

  const { data: qresps } = await supabase
    .from("questionnaire_responses")
    .select("section, question_label, answer_text")
    .eq("patient_id", profile.id);

  const grouped = new Map<
    string,
    Array<{ question_label: string; answer_text: string | null }>
  >();
  (qresps ?? []).forEach((q) => {
    const arr = grouped.get(q.section) ?? [];
    arr.push({ question_label: q.question_label, answer_text: q.answer_text });
    grouped.set(q.section, arr);
  });

  return (
    <AppShell profile={profile}>
      <header>
        <p className="text-sm text-ink-muted">Vos réponses</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mon{" "}
          <span className="font-accent font-normal text-coral">
            questionnaire médical
          </span>
        </h1>
        <p className="mt-2 text-ink-muted">
          Vos réponses servent de base à votre suivi. Elles sont consultées par
          l&apos;équipe médicale.
        </p>
      </header>

      {grouped.size === 0 ? (
        <p className="card mt-7 p-8 text-center text-ink-muted">
          Vous n&apos;avez pas encore complété le questionnaire.
        </p>
      ) : (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {Array.from(grouped.entries()).map(([section, items]) => (
            <section key={section} className="card p-6">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList
                  size={18}
                  strokeWidth={1.75}
                  className="text-coral"
                />
                <h2 className="text-base font-extrabold">{section}</h2>
              </div>
              <dl className="space-y-3">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-sm text-ink-muted">
                      {it.question_label}
                    </dt>
                    <dd className="mt-0.5 font-bold">
                      {it.answer_text ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
