import type { SupabaseClient } from "@supabase/supabase-js";

/** Génère des signed URLs pour un lot de paths Storage. Retourne une
 * Map path → signed URL. Les paths invalides ou inaccessibles
 * (RLS) sont absents de la Map.
 */
export async function generateDocumentSignedUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const filtered = paths.filter((p) => !!p && !p.startsWith("http"));
  if (filtered.length === 0) return result;
  const { data } = await supabase.storage
    .from("documents")
    .createSignedUrls(filtered, expiresIn);
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) result.set(d.path, d.signedUrl);
  });
  return result;
}

/** Resolve a single path/URL stored in documents.file_url to something
 * the browser can fetch. Si c'est déjà une URL http (legacy non migré),
 * la retourne telle quelle. Si c'est un path, génère une signed URL.
 */
export async function resolveDocumentUrl(
  supabase: SupabaseClient,
  fileUrlOrPath: string | null,
): Promise<string | null> {
  if (!fileUrlOrPath) return null;
  if (fileUrlOrPath.startsWith("http")) return fileUrlOrPath;
  const { data } = await supabase.storage
    .from("documents")
    .createSignedUrl(fileUrlOrPath, 3600);
  return data?.signedUrl ?? null;
}
