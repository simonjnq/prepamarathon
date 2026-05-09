"use client";

import { useState } from "react";
import { ClipboardList, Pencil, X } from "lucide-react";
import { saveQuestionnaireAction } from "./actions";

type Item = { question_key: string; question_label: string; answer_text: string | null };
type Section = { name: string; items: Item[] };

export function QuestionnaireForm({ sections }: { sections: Section[] }) {
  const [editing, setEditing] = useState(false);
  const initial: Record<string, string> = {};
  sections.forEach((s) =>
    s.items.forEach((it) => {
      initial[it.question_key] = it.answer_text ?? "";
    }),
  );
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [pending, setPending] = useState(false);

  function update(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function cancel() {
    setAnswers(initial);
    setEditing(false);
  }

  async function save() {
    setPending(true);
    try {
      const updates = Object.entries(answers)
        .filter(([k, v]) => initial[k] !== v)
        .map(([question_key, answer_text]) => ({ question_key, answer_text }));
      if (updates.length > 0) {
        await saveQuestionnaireAction(updates);
      }
      setEditing(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {sections.reduce((acc, s) => acc + s.items.length, 0)} question
          {sections.reduce((acc, s) => acc + s.items.length, 0) > 1 ? "s" : ""}
          ·{" "}
          <span className="font-medium">
            {editing ? "mode édition" : "lecture"}
          </span>
        </p>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancel}
              className="btn-secondary inline-flex items-center gap-1.5"
            >
              <X size={14} strokeWidth={2} /> Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "Enregistrement…" : "Enregistrer mes réponses"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-secondary inline-flex items-center gap-1.5"
          >
            <Pencil size={14} strokeWidth={2} /> Modifier mes réponses
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {sections.map((s) => (
          <section key={s.name} className="card p-6">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList
                size={18}
                strokeWidth={1.75}
                className="text-coral"
              />
              <h2 className="text-base font-extrabold">{s.name}</h2>
            </div>
            <dl className="space-y-3">
              {s.items.map((it) => (
                <div
                  key={it.question_key}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm text-ink-muted">{it.question_label}</dt>
                  {editing ? (
                    <dd className="mt-1.5">
                      <input
                        type="text"
                        value={answers[it.question_key] ?? ""}
                        onChange={(e) =>
                          update(it.question_key, e.target.value)
                        }
                        className="input"
                      />
                    </dd>
                  ) : (
                    <dd className="mt-0.5 font-bold">
                      {it.answer_text ?? "—"}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
