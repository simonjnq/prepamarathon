"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  cancelReminderAction,
  createReminderAction,
  markReminderSentAction,
} from "./reminder-actions";

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  notification: "Notif. app",
};

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  whatsapp: MessageCircle,
  sms: Phone,
  email: Mail,
  notification: Bell,
};

const TEMPLATES: Array<{ label: string; value: string }> = [
  {
    label: "Comment vous sentez-vous ?",
    value:
      "Bonjour, à un mois de votre course, comment vous sentez-vous ? Toute douleur ou question, n'hésitez pas à signaler dans l'app.",
  },
  {
    label: "Suivi douleur",
    value: "Bonjour, votre douleur est-elle toujours présente ?",
  },
  {
    label: "RDV à programmer",
    value:
      "Bonjour, pensez à programmer votre prochain rendez-vous de suivi.",
  },
];

export type Reminder = {
  id: string;
  channel: string;
  message: string;
  scheduled_at: string;
  status: "pending" | "sent" | "cancelled";
  sent_at: string | null;
};

export function RemindersSection({
  patientId,
  reminders,
}: {
  patientId: string;
  reminders: Reminder[];
}) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<keyof typeof CHANNEL_LABELS>(
    "whatsapp",
  );
  const [message, setMessage] = useState("");
  const tomorrow = (() => {
    const d = new Date("2026-05-09T10:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("09:00");
  const [pending, setPending] = useState(false);

  const upcoming = reminders.filter((r) => r.status === "pending");
  const past = reminders
    .filter((r) => r.status !== "pending")
    .slice(0, 3);

  return (
    <section className="card p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Send size={18} strokeWidth={1.75} className="text-coral" />
          <h2 className="text-base font-extrabold">
            Relances programmées
          </h2>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-coral hover:underline"
          >
            <Plus size={12} strokeWidth={2.5} /> Programmer
          </button>
        )}
      </div>

      {open && (
        <form
          action={async (fd) => {
            setPending(true);
            try {
              await createReminderAction(fd);
              setMessage("");
              setOpen(false);
            } finally {
              setPending(false);
            }
          }}
          className="mb-4 rounded-md border border-line bg-surface-warm p-4"
        >
          <input type="hidden" name="patient_id" value={patientId} />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-coral">
              Nouvelle relance
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-light hover:text-coral"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex gap-2">
            {(Object.keys(CHANNEL_LABELS) as Array<keyof typeof CHANNEL_LABELS>).map(
              (c) => {
                const active = c === channel;
                const Icon = CHANNEL_ICONS[c];
                return (
                  <label
                    key={c}
                    className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-sm border px-2 py-2 text-[11px] font-bold transition-colors ${
                      active
                        ? "border-coral bg-coral text-white"
                        : "border-line bg-surface text-ink-muted hover:border-coral hover:text-coral"
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={c}
                      className="sr-only"
                      checked={active}
                      onChange={() => setChannel(c)}
                    />
                    <Icon size={16} strokeWidth={1.75} />
                    {CHANNEL_LABELS[c]}
                  </label>
                );
              },
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Date</span>
              <input
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Heure</span>
              <input
                type="time"
                name="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="input text-sm"
              />
            </label>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs text-ink-muted">Modèles rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMessage(t.value)}
                  className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] text-ink-muted hover:border-coral hover:text-coral"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Message à envoyer au patient…"
            className="input mt-2 resize-y text-sm"
            required
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted hover:border-coral"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending || !message.trim()}
              className="btn-primary text-xs! px-3! py-1.5!"
            >
              {pending ? "Programmation…" : "Programmer la relance"}
            </button>
          </div>
        </form>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Aucune relance programmée.
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <ul className="space-y-2">
              {upcoming.map((r) => {
                const Icon = CHANNEL_ICONS[r.channel] ?? Bell;
                return (
                  <li
                    key={r.id}
                    className="rounded-sm border border-line bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon
                        size={14}
                        strokeWidth={1.75}
                        className="text-coral"
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-coral">
                        {CHANNEL_LABELS[r.channel] ?? r.channel}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {new Date(r.scheduled_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{r.message}</p>
                    <div className="mt-2 flex gap-2">
                      <form action={markReminderSentAction}>
                        <input
                          type="hidden"
                          name="reminder_id"
                          value={r.id}
                        />
                        <input
                          type="hidden"
                          name="patient_id"
                          value={patientId}
                        />
                        <button className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-1 text-[11px] font-bold text-leaf hover:border-leaf">
                          ✓ Marquer envoyée
                        </button>
                      </form>
                      <form action={cancelReminderAction}>
                        <input
                          type="hidden"
                          name="reminder_id"
                          value={r.id}
                        />
                        <input
                          type="hidden"
                          name="patient_id"
                          value={patientId}
                        />
                        <button className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-1 text-[11px] font-bold text-ink-muted hover:border-rust hover:text-rust">
                          Annuler
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {past.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-coral">
                Historique ({past.length})
              </summary>
              <ul className="mt-2 space-y-1.5 pl-2">
                {past.map((r) => {
                  const Icon = CHANNEL_ICONS[r.channel] ?? Bell;
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 text-xs text-ink-muted"
                    >
                      <Icon size={12} strokeWidth={1.75} />
                      <span className="font-bold">
                        {CHANNEL_LABELS[r.channel]}
                      </span>
                      <span>·</span>
                      <span className="line-clamp-1">{r.message}</span>
                      <span className="ml-auto text-ink-light">
                        {r.status === "sent" ? "Envoyée" : "Annulée"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
