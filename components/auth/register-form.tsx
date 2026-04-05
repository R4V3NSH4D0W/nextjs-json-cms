"use client";

import { useActionState } from "react";

import { registerAction, type AuthFormState } from "@/lib/auth/actions";

const initial: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="mx-auto w-full max-w-sm space-y-4">
      <div>
        <label
          htmlFor="reg-email"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[box-shadow] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div>
        <label
          htmlFor="reg-password"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Password (min 8 characters)
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[box-shadow] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
