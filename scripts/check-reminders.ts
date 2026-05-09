import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function check() {
  // 1. Table exists ?
  const { error: countErr, count } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true });
  if (countErr) {
    console.log("✗ Table reminders absente ou inaccessible :");
    console.log(" ", countErr.message);
    console.log("\n→ La migration 0008 n'est pas appliquée.");
    return;
  }
  console.log(`✓ Table reminders existe (${count} ligne(s))`);

  // 2. Migrations 0006 — pouvoir update appointments
  const { error: apptErr } = await supabase
    .from("appointments")
    .update({ duration_min: 30 })
    .eq("id", "00000000-0000-0000-0000-000000000000");
  if (
    apptErr &&
    !["PGRST116", "PGRST204"].includes((apptErr as { code?: string }).code ?? "")
  ) {
    console.log("? appointments update :", apptErr.message);
  } else {
    console.log("✓ appointments writable");
  }

  // 3. Realtime publication
  const { data: pub } = await supabase
    .rpc("pg_publication_tables_check" as never)
    .then(() => ({ data: null as null }))
    .catch(() => ({ data: null as null }));
  void pub;

  // 4. Storage bucket
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.log("? Storage :", bErr.message);
  } else {
    const has = (buckets ?? []).some((b) => b.id === "documents");
    console.log(
      has ? "✓ Bucket 'documents' existe" : "✗ Bucket 'documents' absent",
    );
  }

  // 5. Try insert a reminder for any patient
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .limit(1)
    .single();
  if (patient) {
    const { data, error } = await supabase
      .from("reminders")
      .insert({
        patient_id: patient.id,
        channel: "whatsapp",
        message: "TEST — sera supprimé immédiatement",
        scheduled_at: new Date().toISOString(),
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      console.log("✗ Insert reminder :", error.message);
    } else {
      console.log(`✓ Insert reminder OK (id=${data.id.slice(0, 8)})`);
      await supabase.from("reminders").delete().eq("id", data.id);
      console.log("  (supprimé)");
    }
  }
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
