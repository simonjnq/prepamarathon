import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <p className="font-accent text-2xl text-coral">Via Sana</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            PrépaMarathon
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Votre préparation, <span className="font-accent text-coral">sans angle mort</span>.
          </p>
        </div>

        <div className="card p-7 sm:p-8">
          <h2 className="mb-1 text-xl font-extrabold">Bon retour</h2>
          <p className="mb-6 text-sm text-ink-muted">
            Connectez-vous avec votre identifiant interne.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-light">
          Mode démo · Comptes de test disponibles dans{" "}
          <code className="rounded bg-cream-soft px-1.5 py-0.5">
            DEMO_ACCOUNTS.md
          </code>
        </p>
      </div>
    </main>
  );
}
