import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentCard } from "@/components/document-card";
import { requirePatient } from "@/lib/auth";
import { DOCUMENT_TYPE_LABELS } from "@/lib/labels";

const TYPE_ORDER = [
  "ordonnance",
  "examen",
  "compte_rendu",
  "recommandation",
  "autre",
];

export default async function MesDocumentsPage() {
  const { supabase, profile } = await requirePatient();

  const { data: docs } = await supabase
    .from("documents")
    .select(
      "id, type, title, description, file_url, created_at, uploaded_by",
    )
    .eq("patient_id", profile.id)
    .order("created_at", { ascending: false });

  // Resolve uploaded_by names via a single profiles query.
  const uploaderIds = Array.from(
    new Set((docs ?? []).map((d) => d.uploaded_by).filter((x): x is string => !!x)),
  );
  const profileById = new Map<string, string>();
  if (uploaderIds.length > 0) {
    const { data: ups } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", uploaderIds);
    (ups ?? []).forEach((p) =>
      profileById.set(p.id, `${p.first_name} ${p.last_name}`),
    );
  }

  // Group by type
  const grouped = new Map<string, typeof docs>();
  (docs ?? []).forEach((d) => {
    const arr = grouped.get(d.type) ?? [];
    arr!.push(d);
    grouped.set(d.type, arr as typeof docs);
  });
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <AppShell profile={profile}>
      <header>
        <p className="text-sm text-ink-muted">Vos documents médicaux</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
          Mon{" "}
          <span className="font-accent font-normal text-coral">
            coffre-fort
          </span>
        </h1>
        <p className="mt-2 text-ink-muted">
          Tous les documents transmis par votre équipe de soins, regroupés au
          même endroit.
        </p>
      </header>

      {!docs || docs.length === 0 ? (
        <div className="card mt-7 flex flex-col items-center gap-3 p-10 text-center">
          <FileText size={32} strokeWidth={1.5} className="text-ink-light" />
          <p className="text-ink-muted">
            Aucun document pour l&apos;instant. Votre praticien vous en
            transmettra ici.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {sortedKeys.map((type) => {
            const list = grouped.get(type)!;
            return (
              <section key={type}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-muted">
                  {DOCUMENT_TYPE_LABELS[type] ?? type} · {list?.length ?? 0}
                </h2>
                <div className="grid gap-3">
                  {(list ?? []).map((d) => (
                    <DocumentCard
                      key={d.id}
                      doc={d}
                      uploadedByName={
                        d.uploaded_by ? profileById.get(d.uploaded_by) : null
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
