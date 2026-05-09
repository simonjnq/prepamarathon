"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="identifier"
          className="text-xs font-bold uppercase tracking-wider text-ink-muted"
        >
          Identifiant
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoFocus
          required
          placeholder="prenom.nom"
          className="input"
        />
        <span className="text-xs text-ink-light">
          ex&nbsp;: marie.dubois ou dupont.kine
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-bold uppercase tracking-wider text-ink-muted"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>

      {state?.error && (
        <p className="rounded-sm bg-rust-bg px-3 py-2 text-sm text-rust">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-2 disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
