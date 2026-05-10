"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { fmtRelative, SPECIALTY_LABELS } from "@/lib/labels";
import { sendCaseMessageAction } from "./discussion-actions";

export type CaseMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    specialty: string;
  } | null;
};

export function CaseDiscussion({
  patientId,
  messages,
  currentUserId,
  isAssigned,
}: {
  patientId: string;
  messages: CaseMessage[];
  currentUserId: string;
  isAssigned: boolean;
}) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!isAssigned) {
    return (
      <section className="card p-6">
        <div className="mb-2 flex items-center gap-2">
          <Users size={18} strokeWidth={1.75} className="text-coral" />
          <h2 className="text-base font-extrabold">Discussion d&apos;équipe</h2>
        </div>
        <p className="text-sm text-ink-muted">
          Vous n&apos;êtes pas assigné(e) à ce patient. Demandez à un membre de
          l&apos;équipe de vous inviter pour rejoindre la discussion.
        </p>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-line bg-surface-warm px-6 py-4">
        <Users size={18} strokeWidth={1.75} className="text-coral" />
        <h2 className="text-base font-extrabold">
          Discussion d&apos;équipe
          <span className="ml-2 text-xs font-normal text-ink-muted">
            {messages.length} message{messages.length > 1 ? "s" : ""}
          </span>
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto px-6 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            Pas encore d&apos;échange. Démarrez la conversation.
          </p>
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => {
              const own = m.sender_id === currentUserId;
              const fn = m.sender?.first_name ?? "?";
              const ln = m.sender?.last_name ?? "?";
              return (
                <li
                  key={m.id}
                  className={`flex gap-3 ${own ? "flex-row-reverse" : ""}`}
                >
                  <Avatar firstName={fn} lastName={ln} size={32} />
                  <div className={`min-w-0 max-w-[85%] ${own ? "text-right" : ""}`}>
                    <p className="text-xs text-ink-light">
                      <span className="font-bold text-ink">
                        {own ? "Vous" : `${fn} ${ln}`}
                      </span>
                      {m.sender?.specialty && !own && (
                        <span> · {SPECIALTY_LABELS[m.sender.specialty] ?? m.sender.specialty}</span>
                      )}
                      <span> · {fmtRelative(m.created_at)}</span>
                    </p>
                    <div
                      className={`mt-1 inline-block whitespace-pre-line rounded-lg px-3.5 py-2 text-sm ${
                        own
                          ? "bg-coral text-white"
                          : "bg-surface-warm text-ink"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        action={async (fd) => {
          setPending(true);
          try {
            await sendCaseMessageAction(fd);
            setContent("");
          } finally {
            setPending(false);
          }
        }}
        className="border-t border-line bg-surface-warm px-6 py-4"
      >
        <input type="hidden" name="patient_id" value={patientId} />
        <div className="flex gap-2">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder="Message à l'équipe…"
            className="input resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="btn-primary inline-flex shrink-0 items-center gap-1.5"
          >
            <Send size={14} strokeWidth={2.5} />
            {pending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink-light">
          Cmd/Ctrl + Entrée pour envoyer.
        </p>
      </form>
    </section>
  );
}
