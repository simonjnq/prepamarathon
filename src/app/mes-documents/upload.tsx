"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addPatientDocumentAction } from "./actions";

const TYPES: Array<{ value: string; label: string }> = [
  { value: "examen", label: "Examen" },
  { value: "ordonnance", label: "Ordonnance" },
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "autre", label: "Autre" },
];

export function PatientUpload({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("examen");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file || !title.trim()) {
      setError("Fichier et titre requis.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${patientId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const fd = new FormData();
      fd.append("type", type);
      fd.append("title", title.trim());
      fd.append("file_url", path);
      await addPatientDocumentAction(fd);

      setFile(null);
      setTitle("");
      setOpen(false);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card flex w-full items-center justify-center gap-2 border-dashed py-5 text-sm font-bold text-coral hover:border-coral"
      >
        <Upload size={16} strokeWidth={2} />
        Téléverser un de mes documents
      </button>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-coral">
          Nouveau document
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setFile(null);
            setError(null);
          }}
          className="text-ink-light hover:text-coral"
          aria-label="Fermer"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }
        }}
        className="block w-full text-sm file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-coral hover:file:border-coral"
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">Titre</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : IRM genou"
            className="input text-sm"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-sm bg-rust-bg px-3 py-2 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setFile(null);
            setError(null);
          }}
          className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted hover:border-coral"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !file || !title.trim()}
          className="btn-primary inline-flex items-center gap-1.5 text-xs! px-3! py-1.5!"
        >
          {pending ? (
            <Loader2 size={12} strokeWidth={2} className="animate-spin" />
          ) : (
            <Upload size={12} strokeWidth={2.5} />
          )}
          {pending ? "Upload…" : "Téléverser"}
        </button>
      </div>
    </div>
  );
}
