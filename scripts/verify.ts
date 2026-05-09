import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function check(table: string) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table.padEnd(30)} ${count}`);
}

async function main() {
  console.log("Row counts:");
  for (const t of [
    "profiles",
    "practitioners",
    "patients",
    "journeys",
    "journey_steps",
    "practitioner_assignments",
    "appointments",
    "notes",
    "tasks",
    "alerts",
    "pain_points",
    "questionnaire_responses",
  ]) {
    await check(t);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
