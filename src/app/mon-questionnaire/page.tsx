import { AppShell } from "@/components/app-shell";
import { requirePatient } from "@/lib/auth";
import { QuestionnaireForm } from "./questionnaire-form";

export default async function MonQuestionnairePage() {
  const { supabase, profile } = await requirePatient();

  const { data: qresps } = await supabase
    .from("questionnaire_responses")
    .select("section, question_key, question_label, answer_text")
    .eq("patient_id", profile.id);

  // Group by section
  const grouped = new Map<
    string,
    Array<{ question_key: string; question_label: string; answer_text: string | null }>
  >();
  (qresps ?? []).forEach((q) => {
    const arr = grouped.get(q.section) ?? [];
    arr.push({
      question_key: q.question_key,
      question_label: q.question_label,
      answer_text: q.answer_text,
    });
    grouped.set(q.section, arr);
  });

  const sections = Array.from(grouped.entries()).map(([name, items]) => ({
    name,
    items,
  }));

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
          Vos réponses servent de base à votre suivi. Vos praticiens y ont
          accès. Vous pouvez les actualiser à tout moment.
        </p>
      </header>

      {sections.length === 0 ? (
        <p className="card mt-7 p-8 text-center text-ink-muted">
          Vous n&apos;avez pas encore complété le questionnaire.
        </p>
      ) : (
        <QuestionnaireForm sections={sections} />
      )}
    </AppShell>
  );
}
