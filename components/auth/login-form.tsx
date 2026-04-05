"use client";

import { useActionState } from "react";

import { loginAction, type AuthFormState } from "@/lib/auth/actions";

const initial: AuthFormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="mx-auto w-full max-w-sm space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[box-shadow] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
