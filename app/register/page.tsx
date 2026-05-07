import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getSession, isRegistrationOpen } from "@/lib/auth/session";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.user.isAdmin ? "/admin" : "/dashboard");
  }

  const registrationOpen = await isRegistrationOpen();
  if (!registrationOpen) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Registration closed
          </h1>
          <p className="text-sm text-muted-foreground">
            The first admin account has already been created. Sign in with an existing account.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Create first admin account
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Signup is available only once for initial setup.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
