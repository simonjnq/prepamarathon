import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Journalise un accès dans la table access_log via la RPC log_access
 * (security definer, force actor_id = auth.uid()).
 *
 * Tolérant aux échecs : ne fait pas planter la requête appelante.
 */
export async function logAccess(
  supabase: SupabaseClient,
  args: {
    patientId?: string | null;
    action: string;
    resource?: string | null;
  },
): Promise<void> {
  try {
    await supabase.rpc("log_access", {
      p_patient_id: args.patientId ?? null,
      p_action: args.action,
      p_resource: args.resource ?? null,
    });
  } catch {
    // ne pas bloquer
  }
}
