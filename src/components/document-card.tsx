import {
  ClipboardList,
  Download,
  FileText,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/badge";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_TONES,
  fmtDateLong,
} from "@/lib/labels";

const ICONS: Record<string, LucideIcon> = {
  ordonnance: Pill,
  compte_rendu: ClipboardList,
  recommandation: Sparkles,
  examen: Stethoscope,
  autre: FileText,
};

export function DocumentCard({
  doc,
  uploadedByName,
  compact = false,
}: {
  doc: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    file_url: string | null;
    created_at: string;
  };
  uploadedByName?: string | null;
  compact?: boolean;
}) {
  const Icon = ICONS[doc.type] ?? FileText;
  const tone = DOCUMENT_TYPE_TONES[doc.type] ?? "neutral";

  return (
    <article
      className={`card flex items-start gap-4 ${compact ? "p-4" : "p-5"}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-md ${
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
        style={{ width: compact ? 38 : 44, height: compact ? 38 : 44 }}
      >
        <Icon size={compact ? 18 : 20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Badge variant={tone}>
            {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
          </Badge>
          <p
            className={`font-extrabold ${compact ? "text-sm" : "text-base"} leading-tight`}
          >
            {doc.title}
          </p>
        </div>
        {doc.description && !compact && (
          <p className="mt-1.5 text-sm text-ink-muted">{doc.description}</p>
        )}
        <p className="mt-1.5 text-xs text-ink-light">
          {fmtDateLong(doc.created_at)}
          {uploadedByName && ` · ${uploadedByName}`}
        </p>
      </div>
      <button
        type="button"
        title="Démo — pas de fichier réel"
        className="shrink-0 rounded-md border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-muted hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
        disabled
      >
        <Download
          size={14}
          strokeWidth={1.75}
          className="inline align-text-bottom"
        />
      </button>
    </article>
  );
}
