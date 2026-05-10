"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  addDocumentRowAction,
  updateAppointmentNoteAction,
} from "./actions";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_TONES,
  fmtDateLong,
} from "@/lib/labels";

const DOC_TYPES: Array<{ value: string; label: string }> = [
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "ordonnance", label: "Ordonnance" },
  { value: "examen", label: "Examen" },
  { value: "recommandation", label: "Recommandation" },
  { value: "autre", label: "Autre" },
];

export type AppointmentDoc = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  created_at: string;
};

export function AppointmentNotesPanel({
  apptId,
  patientId,
  initialSummary,
  initialDocs,
  canEdit = true,
}: {
  apptId: string;
  patientId: string;
  initialSummary: string | null;
  initialDocs: AppointmentDoc[];
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("compte_rendu");
  const [docTitle, setDocTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docCount = initialDocs.length;

  async function saveNote() {
    setSavingNote(true);
    try {
      const fd = new FormData();
      fd.append("appointment_id", apptId);
      fd.append("patient_id", patientId);
      fd.append("summary", summary);
      await updateAppointmentNoteAction(fd);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } finally {
      setSavingNote(false);
    }
  }

  async function uploadDoc() {
    if (!file || !docTitle.trim()) {
      setUploadError("Fichier et titre requis.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${patientId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const fd = new FormData();
      fd.append("patient_id", patientId);
      fd.append("appointment_id", apptId);
      fd.append("type", docType);
      fd.append("title", docTitle.trim());
      fd.append("file_url", path);
      await addDocumentRowAction(fd);

      setFile(null);
      setDocTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-coral hover:border-coral"
      >
        <FileText size={12} strokeWidth={2.5} />
        Note & documents
        {docCount > 0 && (
          <span className="ml-1 rounded-full bg-coral-bg px-1.5 py-0.5 text-[10px] text-coral">
            {docCount}
          </span>
        )}
        {open ? (
          <ChevronUp size={12} strokeWidth={2} />
        ) : (
          <ChevronDown size={12} strokeWidth={2} />
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-md border border-line bg-surface-warm p-3">
          {!canEdit && (
            <p className="rounded-sm bg-stone-bg px-2.5 py-1.5 text-xs text-stone">
              🔒 Lecture seule — vous n&apos;êtes pas le praticien de ce RDV.
            </p>
          )}
          {/* Note / compte rendu */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Compte rendu / note de consultation
            </label>
            {canEdit ? (
              <>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="Observations, diagnostic, recommandations…"
                  className="input mt-1.5 resize-y text-sm"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  {savedAt ? (
                    <span className="text-xs font-bold text-leaf">
                      ✓ Note enregistrée
                    </span>
                  ) : (
                    <span className="text-xs text-ink-light" />
                  )}
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={savingNote}
                    className="btn-primary text-xs! px-3! py-1!"
                  >
                    {savingNote ? "…" : "Enregistrer la note"}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-1.5 whitespace-pre-line rounded-sm bg-surface px-2.5 py-2 text-sm text-ink">
                {summary || (
                  <span className="italic text-ink-light">
                    Aucun compte rendu rédigé.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Existing docs */}
          {initialDocs.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Documents joints ({initialDocs.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {initialDocs.map((d) => {
                  const tone = DOCUMENT_TYPE_TONES[d.type] ?? "neutral";
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-sm border border-line bg-surface px-2 py-1.5"
                    >
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          tone === "coral"
                            ? "bg-coral-bg text-coral"
                            : tone === "leaf"
                              ? "bg-leaf-bg text-leaf"
                              : tone === "amber"
                                ? "bg-amber-bg text-amber"
                                : tone === "stone"
                                  ? "bg-stone-bg text-stone"
                                  : "bg-cream-soft text-ink-muted"
                        }`}
                      >
                        {DOCUMENT_TYPE_LABELS[d.type] ?? d.type}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {d.title}
                      </span>
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-coral hover:text-coral-hover"
                          title="Ouvrir"
                        >
                          <Download size={12} strokeWidth={2} />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Upload */}
          {canEdit && (
          <div className="border-t border-line pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Joindre un document à ce RDV
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!docTitle) setDocTitle(f.name.replace(/\.[^.]+$/, ""));
                }
              }}
              className="mt-1.5 block w-full text-xs file:mr-2 file:rounded-sm file:border file:border-line file:bg-surface file:px-2.5 file:py-1 file:text-[11px] file:font-bold file:text-coral hover:file:border-coral"
            />
            {file && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="input text-sm"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Titre du document"
                  className="input text-sm"
                />
              </div>
            )}
            {uploadError && (
              <p className="mt-2 rounded-sm bg-rust-bg px-2 py-1 text-xs text-rust">
                {uploadError}
              </p>
            )}
            {file && (
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setDocTitle("");
                    setUploadError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink-muted hover:border-coral"
                >
                  <X size={12} strokeWidth={2} /> Annuler
                </button>
                <button
                  type="button"
                  onClick={uploadDoc}
                  disabled={uploading || !file || !docTitle.trim()}
                  className="btn-primary inline-flex items-center gap-1.5 text-xs! px-3! py-1!"
                >
                  {uploading ? (
                    <Loader2
                      size={12}
                      strokeWidth={2}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload size={12} strokeWidth={2.5} />
                  )}
                  {uploading ? "Upload…" : "Téléverser"}
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
