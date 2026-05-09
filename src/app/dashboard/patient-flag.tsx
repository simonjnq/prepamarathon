"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { flagFromPatientAction } from "./actions";

const CATEGORIES: Array<{ value: string; label: string; color: string }> = [
  { value: "pain_increase", label: "Une douleur s'aggrave", color: "rust" },
  {
    value: "pain_persistent",
    label: "Une douleur persiste",
    color: "amber",
  },
  {
    value: "appointment_missed",
    label: "RDV manqué / pas pris",
    color: "amber",
  },
  { value: "fatigue", label: "Fatigue inhabituelle", color: "amber" },
  { value: "other", label: "Autre", color: "stone" },
];

export function PatientFlag() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("pain_persistent");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="card flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-bg">
          <AlertCircle size={20} strokeWidth={1.75} className="text-leaf" />
        </div>
        <div>
          <p className="font-bold">Signalement transmis</p>
          <p className="mt-1 text-sm text-ink-muted">
            Votre équipe de soins est notifiée. Un praticien reviendra vers
            vous rapidement.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMessage("");
              setOpen(false);
            }}
            className="mt-2 text-sm font-medium text-coral hover:underline"
          >
            Signaler autre chose
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden ${open ? "p-5" : "p-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 ${
          open ? "" : "p-5"
        } text-left`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-bg">
            <AlertCircle size={20} strokeWidth={1.75} className="text-coral" />
          </div>
          <div>
            <p className="font-bold">J&apos;ai un souci à signaler</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Une douleur, un RDV manqué, une question. Votre équipe est
              alertée.
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-ink-light" />
        ) : (
          <ChevronDown size={18} className="text-ink-light" />
        )}
      </button>

      {open && (
        <form
          action={async (fd) => {
            setPending(true);
            try {
              await flagFromPatientAction(fd);
              setSent(true);
            } finally {
              setPending(false);
            }
          }}
          className="mt-5 border-t border-line pt-5"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            De quoi s&apos;agit-il ?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c.value === category;
              return (
                <label
                  key={c.value}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "border-coral bg-coral text-white"
                      : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    className="sr-only"
                    checked={active}
                    onChange={() => setCategory(c.value)}
                  />
                  {c.label}
                </label>
              );
            })}
          </div>

          <label
            htmlFor="message"
            className="mt-5 block text-xs font-bold uppercase tracking-wider text-ink-muted"
          >
            Décrivez en quelques mots
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Ex : ma douleur au mollet est revenue après ma sortie longue de samedi…"
            className="input mt-2 resize-y"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Send size={14} strokeWidth={2} />
              {pending ? "Envoi…" : "Transmettre"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
